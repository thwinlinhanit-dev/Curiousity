// Shared shape of a course index (content/courses/<key>.json), used by the
// pack loader and the pages that render a course.
export type CourseIndex = {
  key: string;
  ladder: string;
  title: string;
  units: { key: string; title: string }[];
  topics: { id: string; slug: string; unit: string; title: string }[];
};
