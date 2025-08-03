-- 既存のbird_imagesテーブルを削除して再作成するSQL

-- 既存テーブルを削除 (存在する場合)
DROP TABLE IF EXISTS bird_images CASCADE;

-- 野鳥画像テーブルを新規作成
CREATE TABLE bird_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bird_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  source TEXT,
  license TEXT,
  photographer TEXT,
  attribution TEXT,
  credit TEXT,
  width INTEGER,
  height INTEGER,
  file_size BIGINT,
  mime_type TEXT,
  quality_score INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 外部キー制約を追加 (birdsテーブルが存在する場合)
ALTER TABLE bird_images ADD CONSTRAINT fk_bird_images_bird_id FOREIGN KEY (bird_id) REFERENCES birds(id) ON DELETE CASCADE;

-- インデックス作成
CREATE INDEX idx_bird_images_bird_id ON bird_images(bird_id);
CREATE INDEX idx_bird_images_is_active ON bird_images(is_active);

-- RLS (Row Level Security) の有効化
ALTER TABLE bird_images ENABLE ROW LEVEL SECURITY;