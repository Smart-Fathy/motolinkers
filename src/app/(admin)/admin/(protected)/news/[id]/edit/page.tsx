import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewsForm from "../../NewsForm";

export const metadata = { title: "Edit article — MotoLinkers Admin" };

export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: article } = await supabase
    .from("news")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!article) notFound();

  return (
    <>
      <div className="adm__page-head">
        <div>
          <h1 className="adm__h1">
            Edit <em>{article.title}</em>
          </h1>
          <p className="adm__sub">/news/{article.slug}</p>
        </div>
      </div>
      <NewsForm article={article} />
    </>
  );
}
