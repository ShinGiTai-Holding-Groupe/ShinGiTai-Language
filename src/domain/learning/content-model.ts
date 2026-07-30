export const CEFR_LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"] as const;

export type CefrLevel = (typeof CEFR_LEVELS)[number];

export const SUPPORTED_LANGUAGE_CODES = [
  "ja",
  "en",
  "no",
  "pl",
  "zh",
  "ko",
  "de",
  "fr",
  "es",
  "it",
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGE_CODES)[number];

export type LearningSkill =
  | "vocabulary"
  | "grammar"
  | "reading"
  | "listening"
  | "writing"
  | "speaking"
  | "pronunciation"
  | "culture";

export type ExerciseKind =
  | "multiple-choice"
  | "single-choice"
  | "matching"
  | "ordering"
  | "fill-gap"
  | "translation"
  | "dictation"
  | "free-writing"
  | "pronunciation"
  | "guided-dialogue";

export interface LocalizedText {
  readonly locale: string;
  readonly value: string;
}

export interface LearningExample {
  readonly id: string;
  readonly source: string;
  readonly translation: string;
  readonly transliteration?: string;
  readonly note?: string;
  readonly audioAssetId?: string;
}

export interface VocabularyEntry {
  readonly id: string;
  readonly language: SupportedLanguageCode;
  readonly level: CefrLevel;
  readonly term: string;
  readonly translation: string;
  readonly transliteration?: string;
  readonly partOfSpeech?: string;
  readonly pronunciation?: string;
  readonly tags: readonly string[];
  readonly examples: readonly LearningExample[];
}

export interface ExerciseOption {
  readonly id: string;
  readonly label: string;
  readonly value: string;
}

export interface LessonExercise {
  readonly id: string;
  readonly kind: ExerciseKind;
  readonly skill: LearningSkill;
  readonly prompt: string;
  readonly instructions?: string;
  readonly options?: readonly ExerciseOption[];
  readonly acceptedAnswers?: readonly string[];
  readonly explanation?: string;
  readonly vocabularyIds?: readonly string[];
  readonly points: number;
}

export interface LessonSection {
  readonly id: string;
  readonly title: string;
  readonly explanation: string;
  readonly examples: readonly LearningExample[];
  readonly exercises: readonly LessonExercise[];
}

export interface LessonDefinition {
  readonly id: string;
  readonly language: SupportedLanguageCode;
  readonly level: CefrLevel;
  readonly unitId: string;
  readonly title: string;
  readonly summary: string;
  readonly estimatedMinutes: number;
  readonly skills: readonly LearningSkill[];
  readonly prerequisites: readonly string[];
  readonly vocabularyIds: readonly string[];
  readonly sections: readonly LessonSection[];
  readonly passingScore: number;
  readonly published: boolean;
}

export interface CourseUnit {
  readonly id: string;
  readonly language: SupportedLanguageCode;
  readonly level: CefrLevel;
  readonly title: string;
  readonly description: string;
  readonly lessonIds: readonly string[];
  readonly examId?: string;
  readonly sortOrder: number;
}

export interface LanguageCourse {
  readonly language: SupportedLanguageCode;
  readonly displayName: string;
  readonly nativeName: string;
  readonly writingSystems: readonly string[];
  readonly availableLevels: readonly CefrLevel[];
  readonly units: readonly CourseUnit[];
}

export function isCefrLevel(value: string): value is CefrLevel {
  return CEFR_LEVELS.includes(value as CefrLevel);
}

export function isSupportedLanguageCode(value: string): value is SupportedLanguageCode {
  return SUPPORTED_LANGUAGE_CODES.includes(value as SupportedLanguageCode);
}

export function assertValidLesson(lesson: LessonDefinition): void {
  if (!isSupportedLanguageCode(lesson.language)) {
    throw new Error(`Unsupported lesson language: ${lesson.language}`);
  }

  if (!isCefrLevel(lesson.level)) {
    throw new Error(`Unsupported CEFR level: ${lesson.level}`);
  }

  if (lesson.estimatedMinutes <= 0) {
    throw new Error(`Lesson ${lesson.id} must have a positive duration`);
  }

  if (lesson.passingScore < 0 || lesson.passingScore > 100) {
    throw new Error(`Lesson ${lesson.id} has an invalid passing score`);
  }

  if (lesson.sections.length === 0) {
    throw new Error(`Lesson ${lesson.id} must contain at least one section`);
  }

  const exerciseIds = new Set<string>();
  for (const section of lesson.sections) {
    if (section.exercises.length === 0) {
      throw new Error(`Lesson section ${section.id} must contain exercises`);
    }

    for (const exercise of section.exercises) {
      if (exercise.points <= 0) {
        throw new Error(`Exercise ${exercise.id} must award positive points`);
      }
      if (exerciseIds.has(exercise.id)) {
        throw new Error(`Duplicate exercise id: ${exercise.id}`);
      }
      exerciseIds.add(exercise.id);
    }
  }
}
