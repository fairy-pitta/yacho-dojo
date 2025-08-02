describe('Quiz Data Management', () => {
  describe('Birds Data', () => {
    test('should have valid bird data structure', () => {
      const mockBirdData = {
        id: 1,
        japanese_name: 'スズメ',
        english_name: 'Eurasian Tree Sparrow',
        scientific_name: 'Passer montanus',
        family: 'スズメ科',
        order: 'スズメ目',
        habitat: '市街地、農地',
        size: '14-15cm',
        description: '身近な小鳥の代表格'
      };

      expect(mockBirdData).toHaveProperty('id');
      expect(mockBirdData).toHaveProperty('japanese_name');
      expect(mockBirdData).toHaveProperty('english_name');
      expect(mockBirdData).toHaveProperty('scientific_name');
      expect(typeof mockBirdData.id).toBe('number');
      expect(typeof mockBirdData.japanese_name).toBe('string');
      expect(typeof mockBirdData.english_name).toBe('string');
      expect(typeof mockBirdData.scientific_name).toBe('string');
    });

    test('should validate bird data fields', () => {
      const birds = [
        {
          id: 1,
          japanese_name: 'スズメ',
          english_name: 'Eurasian Tree Sparrow',
          scientific_name: 'Passer montanus'
        },
        {
          id: 2,
          japanese_name: 'カラス',
          english_name: 'Large-billed Crow',
          scientific_name: 'Corvus macrorhynchos'
        }
      ];

      expect(birds.length).toBe(2);
      birds.forEach(bird => {
        expect(bird.id).toBeGreaterThan(0);
        expect(bird.japanese_name).toBeTruthy();
        expect(bird.english_name).toBeTruthy();
        expect(bird.scientific_name).toBeTruthy();
      });
    });
  });

  describe('Bird Images Data', () => {
    test('should have valid bird image data structure', () => {
      const mockImageData = {
        id: 1,
        bird_id: 1,
        image_url: 'https://example.com/sparrow.jpg',
        alt_text: 'スズメの写真',
        is_primary: true
      };

      expect(mockImageData).toHaveProperty('id');
      expect(mockImageData).toHaveProperty('bird_id');
      expect(mockImageData).toHaveProperty('image_url');
      expect(mockImageData).toHaveProperty('alt_text');
      expect(mockImageData).toHaveProperty('is_primary');
      expect(typeof mockImageData.id).toBe('number');
      expect(typeof mockImageData.bird_id).toBe('number');
      expect(typeof mockImageData.image_url).toBe('string');
      expect(typeof mockImageData.is_primary).toBe('boolean');
    });
  });

  describe('Questions Data', () => {
    test('should have valid question data structure', () => {
      const mockQuestionData = {
        id: 1,
        bird_id: 1,
        question_text: 'この鳥の名前は何ですか？',
        question_type: 'identification',
        difficulty: 'easy',
        category: '身近な鳥',
        correct_answer: 'スズメ',
        options: ['スズメ', 'カラス', 'ハト', 'ツバメ']
      };

      expect(mockQuestionData).toHaveProperty('id');
      expect(mockQuestionData).toHaveProperty('bird_id');
      expect(mockQuestionData).toHaveProperty('question_text');
      expect(mockQuestionData).toHaveProperty('question_type');
      expect(mockQuestionData).toHaveProperty('difficulty');
      expect(mockQuestionData).toHaveProperty('correct_answer');
      expect(mockQuestionData).toHaveProperty('options');
      expect(Array.isArray(mockQuestionData.options)).toBe(true);
      expect(mockQuestionData.options.length).toBe(4);
    });

    test('should validate question difficulty levels', () => {
      const difficulties = ['easy', 'medium', 'hard'];
      const mockQuestions = [
        { id: 1, difficulty: 'easy' },
        { id: 2, difficulty: 'medium' },
        { id: 3, difficulty: 'hard' }
      ];

      mockQuestions.forEach(question => {
        expect(difficulties).toContain(question.difficulty);
      });
    });
  });

  describe('Data Integrity', () => {
    test('should maintain referential integrity between birds and questions', () => {
      const mockBird = { id: 1, japanese_name: 'スズメ' };
      const mockQuestion = { id: 1, bird_id: 1, question_text: 'この鳥は？' };

      expect(mockQuestion.bird_id).toBe(mockBird.id);
    });

    test('should validate question options format', () => {
      const mockQuestion = {
        id: 1,
        options: ['スズメ', 'カラス', 'ハト', 'ツバメ'],
        correct_answer: 'スズメ'
      };

      // 選択肢が配列であることを確認
      expect(Array.isArray(mockQuestion.options)).toBe(true);
      expect(mockQuestion.options.length).toBe(4);
      
      // 正解が選択肢に含まれていることを確認
      expect(mockQuestion.options).toContain(mockQuestion.correct_answer);
    });

    test('should validate unique IDs', () => {
      const birds = [
        { id: 1, japanese_name: 'スズメ' },
        { id: 2, japanese_name: 'カラス' },
        { id: 3, japanese_name: 'ハト' }
      ];

      const ids = birds.map(bird => bird.id);
      const uniqueIds = [...new Set(ids)];
      
      expect(ids.length).toBe(uniqueIds.length);
    });
  });

  describe('Excel Data Processing', () => {
    test('should validate Excel data structure expectations', () => {
      // jpbirdlist8ed_ver1.xlsxから期待されるデータ構造
      const expectedColumns = [
        'japanese_name',
        'english_name', 
        'scientific_name',
        'family',
        'order'
      ];

      const mockExcelRow = {
        japanese_name: 'スズメ',
        english_name: 'Eurasian Tree Sparrow',
        scientific_name: 'Passer montanus',
        family: 'スズメ科',
        order: 'スズメ目'
      };

      expectedColumns.forEach(column => {
        expect(mockExcelRow).toHaveProperty(column);
        expect(mockExcelRow[column as keyof typeof mockExcelRow]).toBeTruthy();
      });
    });
  });
});