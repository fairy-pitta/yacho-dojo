-- bird_images.csvのデータをSupabaseに挿入するためのSQL
-- このファイルは手動で実行するか、Supabaseのダッシュボードで実行してください

-- 既存のbird_imagesテーブルのデータを削除（必要に応じて）
-- DELETE FROM bird_images;

-- CSVファイルからのデータ挿入
-- 注意: 実際のCSVデータは別途処理が必要です
-- 以下は挿入用のテンプレートです

/*
INSERT INTO bird_images (
  id,
  bird_id,
  image_url,
  source,
  license,
  photographer,
  attribution,
  credit,
  width,
  height,
  file_size,
  mime_type,
  quality_score,
  is_active,
  created_at
) VALUES
-- ここにCSVデータを変換した値を挿入
*/

-- CSVファイルを直接インポートする場合は、Supabaseのダッシュボードまたは
-- psqlコマンドを使用してください：
-- \copy bird_images(id,bird_id,image_url,source,license,photographer,attribution,credit,width,height,file_size,mime_type,quality_score,is_active,created_at) FROM '/path/to/bird_images.csv' DELIMITER ',' CSV HEADER;