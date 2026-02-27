import { useEffect, useState } from "react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import SearchBar from "../components/SearchBar";
import MoviesSection from "../components/MoviesSection";
import { getNowPlayingMovies } from "../api";

function Home() {
  const [allMovies, setAllMovies] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    console.log("Запрашиваем фильмы...");

    getNowPlayingMovies()
      .then((data) => {
        console.log("Данные получены:", data);
        if (!cancelled) {
          setAllMovies(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        console.error("❌ Ошибка:", err);
        if (!cancelled) {
          setError(err.message || "Не удалось загрузить фильмы");
          setAllMovies([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  console.log("Home рендерится с:", { 
    moviesCount: allMovies.length, 
    loading, 
    error,
    search 
  });

  return (
    <div className="app">
      <Header />
      <Hero />
      <SearchBar onSearch={setSearch} />
      <MoviesSection
        movies={allMovies}
        search={search}
        loading={loading}
        error={error}
      />
    </div>
  );
}

export default Home;