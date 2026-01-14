
export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Annotation {
  id: string;
  label: string;
  confidence: number;
  bbox: BoundingBox;
  source: string;
}

export interface ProjectImage {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  annotations: Annotation[];
  status: 'unlabeled' | 'labeled' | 'auto-labeled';
}

export interface Project {
  id: string;
  name: string;
  classes: string[];
  images: ProjectImage[];
}

export enum ModelBackend {
  Ollama = 'Ollama',
  LMStudio = 'LMStudio',
  Mock = 'Mock'
}

export interface InferenceParams {
  backend: ModelBackend;
  model: string;
  prompt: string;
}
