-- Add time_taken column to user_answers table
ALTER TABLE user_answers ADD COLUMN time_taken INTEGER;

-- Add comment for the new column
COMMENT ON COLUMN user_answers.time_taken IS 'Time taken to answer the question in seconds';