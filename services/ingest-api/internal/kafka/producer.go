package kafka

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	kafkago "github.com/segmentio/kafka-go"
)

type Producer struct {
	writer *kafkago.Writer
	topic  string
}

func NewProducer(brokers string, topic string) *Producer {
	return &Producer{
		topic: topic,
		writer: &kafkago.Writer{
			Addr:         kafkago.TCP(brokers),
			Topic:        topic,
			Balancer:     &kafkago.Hash{},
			BatchSize:    100,
			BatchTimeout: 10 * time.Millisecond,
			RequiredAcks: kafkago.RequireOne,
			Async:        false,
		},
	}
}

func (p *Producer) Publish(ctx context.Context, key string, payload any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal kafka payload: %w", err)
	}

	message := kafkago.Message{
		Key:   []byte(key),
		Value: body,
		Time:  time.Now().UTC(),
	}

	if err := p.writer.WriteMessages(ctx, message); err != nil {
		return fmt.Errorf("write kafka message: %w", err)
	}
	return nil
}

func (p *Producer) Close() error {
	return p.writer.Close()
}
