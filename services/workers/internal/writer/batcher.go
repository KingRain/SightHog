package writer

import (
	"sync"
	"time"
)

type Batcher[T any] struct {
	mu      sync.Mutex
	items   []T
	maxSize int
	maxWait time.Duration
	onFlush func([]T) error
	stopCh  chan struct{}
	doneCh  chan struct{}
}

func NewBatcher[T any](maxSize int, maxWait time.Duration, onFlush func([]T) error) *Batcher[T] {
	return &Batcher[T]{
		maxSize: maxSize,
		maxWait: maxWait,
		onFlush: onFlush,
		stopCh:  make(chan struct{}),
		doneCh:  make(chan struct{}),
	}
}

func (b *Batcher[T]) Start() {
	go func() {
		defer close(b.doneCh)
		ticker := time.NewTicker(b.maxWait)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				b.Flush()
			case <-b.stopCh:
				b.Flush()
				return
			}
		}
	}()
}

func (b *Batcher[T]) Stop() {
	close(b.stopCh)
	<-b.doneCh
}

func (b *Batcher[T]) Add(item T) error {
	b.mu.Lock()
	b.items = append(b.items, item)
	shouldFlush := len(b.items) >= b.maxSize
	b.mu.Unlock()

	if shouldFlush {
		return b.Flush()
	}
	return nil
}

func (b *Batcher[T]) Flush() error {
	b.mu.Lock()
	if len(b.items) == 0 {
		b.mu.Unlock()
		return nil
	}
	batch := b.items
	b.items = nil
	b.mu.Unlock()

	return b.onFlush(batch)
}
