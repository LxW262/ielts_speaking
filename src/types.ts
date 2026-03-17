export interface Practice {
  id: string;
  userId: string;
  question?: string;
  topic?: string;
  keywords?: string[];
  part: 'Part 1' | 'Part 2' | 'Part 3';
  chineseInput?: string;
  englishResponse: string;
  createdAt: any;
}
