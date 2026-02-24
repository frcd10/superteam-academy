import { PlatformLayout } from "@/components/layout";
import { courseService } from "@/services";
import { CourseCatalog } from "./course-catalog";

export default async function CoursesPage() {
  const courses = await courseService.getCourses();

  return (
    <PlatformLayout>
      <CourseCatalog initialCourses={courses} />
    </PlatformLayout>
  );
}
