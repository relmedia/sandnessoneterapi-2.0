import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCourse } from "@/lib/content";

import { CourseForm } from "../_components/course-form";

export default async function CourseEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const course = isNew ? null : await getCourse(id);

  if (!isNew && !course) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {isNew ? "Nytt kurs" : "Rediger kurs"}
        </h1>
        <p className="text-muted-foreground text-sm">Endringer vises på nettsiden etter lagring.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isNew ? "Opprett kurs" : course?.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CourseForm course={course} />
        </CardContent>
      </Card>
    </div>
  );
}
