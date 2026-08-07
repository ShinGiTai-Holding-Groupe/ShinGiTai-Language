export type GeneratedQuestion = {
  section: string;
  prompt: string;
  options: string[];
  correct_index: number;
};

export async function generateExamQuestions(
  _languageName: string,
  _nativeName: string,
  _level: string,
  _count: number,
): Promise<GeneratedQuestion[]> {
  throw new Error(
    "Exam generation is quarantined until an accepted OdynAI application contract is available",
  );
}
