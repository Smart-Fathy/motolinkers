import NewsForm from "../NewsForm";

export const metadata = { title: "New article — MotoLinkers Admin" };

export default function NewNewsPage() {
  return (
    <>
      <div className="adm__page-head">
        <div>
          <h1 className="adm__h1">
            New <em>article</em>
          </h1>
          <p className="adm__sub">Add a news item.</p>
        </div>
      </div>
      <NewsForm />
    </>
  );
}
