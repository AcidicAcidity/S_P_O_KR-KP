import { useState } from "react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import SearchBar from "../components/SearchBar";
import MoviesSection from "../components/MoviesSection";

function Home() {
  const [search, setSearch] = useState("");

  return (
    <div className="app">
      <Header />
      <Hero />
      <SearchBar onSearch={setSearch} />
      <MoviesSection search={search} />
    </div>
  );
}

export default Home;