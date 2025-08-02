import {
  calculateAccuracy,
  formatTime,
  formatDate,
  calculateStreak,
  shuffleArray,
  getDifficultyColor
} from '../utils'

describe('Utils', () => {
  describe('calculateAccuracy', () => {
    it('正解率を正しく計算する', () => {
      expect(calculateAccuracy(8, 10)).toBe(80)
      expect(calculateAccuracy(0, 10)).toBe(0)
      expect(calculateAccuracy(10, 10)).toBe(100)
    })

    it('総問題数が0の場合は0を返す', () => {
      expect(calculateAccuracy(5, 0)).toBe(0)
    })
  })

  describe('formatTime', () => {
    it('時間を正しくフォーマットする', () => {
      expect(formatTime(5000)).toBe('5秒')
      expect(formatTime(65000)).toBe('1分5秒')
      expect(formatTime(120000)).toBe('2分0秒')
    })
  })

  describe('formatDate', () => {
    it('日付を正しくフォーマットする', () => {
      const date = new Date('2024-01-15')
      const formatted = formatDate(date)
      expect(formatted).toContain('2024年')
      expect(formatted).toContain('1月')
      expect(formatted).toContain('15日')
    })
  })

  describe('calculateStreak', () => {
    it('学習ストリークを正しく計算する', () => {
      const today = new Date()
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      
      expect(calculateStreak(today.toISOString())).toBe(1)
      expect(calculateStreak(yesterday.toISOString())).toBe(1)
      expect(calculateStreak()).toBe(0)
    })
  })

  describe('shuffleArray', () => {
    it('配列をシャッフルする', () => {
      const original = [1, 2, 3, 4, 5]
      const shuffled = shuffleArray(original)
      
      expect(shuffled).toHaveLength(original.length)
      expect(shuffled).toEqual(expect.arrayContaining(original))
      expect(original).toEqual([1, 2, 3, 4, 5]) // 元の配列は変更されない
    })
  })

  describe('getDifficultyColor', () => {
    it('難易度に応じた色クラスを返す', () => {
      expect(getDifficultyColor('easy')).toBe('text-green-600 bg-green-100')
      expect(getDifficultyColor('medium')).toBe('text-yellow-600 bg-yellow-100')
      expect(getDifficultyColor('hard')).toBe('text-red-600 bg-red-100')
    })
  })
})