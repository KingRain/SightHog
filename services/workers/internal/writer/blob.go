package writer

import (
	"bytes"
	"compress/gzip"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"sync"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/sighthog/workers/internal/config"
)

type BlobWriter struct {
	client   *s3.Client
	bucket   string
	interval time.Duration

	mu       sync.Mutex
	sessions map[string][]any
	stopCh   chan struct{}
	doneCh   chan struct{}
}

func NewBlobWriter(client *s3.Client, cfg config.Config) *BlobWriter {
	return &BlobWriter{
		client:   client,
		bucket:   cfg.SeaweedBucket,
		interval: cfg.BlobFlushInterval,
		sessions: make(map[string][]any),
		stopCh:   make(chan struct{}),
		doneCh:   make(chan struct{}),
	}
}

func (w *BlobWriter) Start() {
	go func() {
		defer close(w.doneCh)
		ticker := time.NewTicker(w.interval)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				_ = w.FlushAll(context.Background())
			case <-w.stopCh:
				_ = w.FlushAll(context.Background())
				return
			}
		}
	}()
}

func (w *BlobWriter) Stop() {
	close(w.stopCh)
	<-w.doneCh
}

func (w *BlobWriter) Append(sessionID string, events []any) {
	if len(events) == 0 {
		return
	}

	w.mu.Lock()
	w.sessions[sessionID] = append(w.sessions[sessionID], events...)
	w.mu.Unlock()
}

func (w *BlobWriter) FlushAll(ctx context.Context) error {
	w.mu.Lock()
	snapshot := w.sessions
	w.sessions = make(map[string][]any)
	w.mu.Unlock()

	var firstErr error
	for sessionID, events := range snapshot {
		if len(events) == 0 {
			continue
		}
		if err := w.uploadSession(ctx, sessionID, events); err != nil {
			w.mu.Lock()
			w.sessions[sessionID] = append(w.sessions[sessionID], events...)
			w.mu.Unlock()
			if firstErr == nil {
				firstErr = err
			}
		}
	}
	return firstErr
}

func (w *BlobWriter) downloadSession(ctx context.Context, sessionID string) ([]any, error) {
	key := sessionID + ".json.gz"
	resp, err := w.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(w.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		var notFound *types.NoSuchKey
		if errors.As(err, &notFound) {
			return nil, nil
		}
		var notFoundAlt *types.NotFound
		if errors.As(err, &notFoundAlt) {
			return nil, nil
		}
		return nil, fmt.Errorf("get object %s: %w", key, err)
	}
	defer resp.Body.Close()

	compressed, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read object %s: %w", key, err)
	}

	reader, err := gzip.NewReader(bytes.NewReader(compressed))
	if err != nil {
		return nil, fmt.Errorf("gzip open %s: %w", key, err)
	}
	defer reader.Close()

	decompressed, err := io.ReadAll(reader)
	if err != nil {
		return nil, fmt.Errorf("gzip read %s: %w", key, err)
	}

	var events []any
	if err := json.Unmarshal(decompressed, &events); err != nil {
		return nil, fmt.Errorf("unmarshal replay %s: %w", key, err)
	}

	return events, nil
}

func (w *BlobWriter) uploadSession(ctx context.Context, sessionID string, newEvents []any) error {
	existing, err := w.downloadSession(ctx, sessionID)
	if err != nil {
		return err
	}

	events := MergeEvents(existing, newEvents)
	if len(events) == 0 {
		return nil
	}

	body, err := json.Marshal(events)
	if err != nil {
		return fmt.Errorf("marshal replay events: %w", err)
	}

	var buf bytes.Buffer
	gz := gzip.NewWriter(&buf)
	if _, err := gz.Write(body); err != nil {
		return fmt.Errorf("gzip write: %w", err)
	}
	if err := gz.Close(); err != nil {
		return fmt.Errorf("gzip close: %w", err)
	}

	key := sessionID + ".json.gz"
	_, err = w.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:          aws.String(w.bucket),
		Key:             aws.String(key),
		Body:            bytes.NewReader(buf.Bytes()),
		ContentType:     aws.String("application/gzip"),
		ContentEncoding: aws.String("gzip"),
	})
	if err != nil {
		return fmt.Errorf("put object %s: %w", key, err)
	}

	return nil
}
