// src/App.tsx
import React, { useState } from 'react';

interface PokemonData {
  name: string;
  sprites: {
    front_default: string;
  };
  abilities: { ability: { name: string } }[];
  types: { type: { name: string } }[];
}

interface EvolutionChain {
  name: string;
  sprite: string;
  minLevel: number | null;
}

const App: React.FC = () => {
  const [pokemonName, setPokemonName] = useState('');
  const [pokemonData, setPokemonData] = useState<PokemonData | null>(null);
  const [evolutionChain, setEvolutionChain] = useState<EvolutionChain[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!pokemonName.trim()) {
      setError('Por favor ingresa el nombre de un Pokémon');
      setPokemonData(null);
      setEvolutionChain([]);
      return;
    }

    setLoading(true);
    setError('');
    setPokemonData(null);
    setEvolutionChain([]);

    try {
      // Fetch Pokémon data
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`);
      if (!response.ok) {
        throw new Error('Pokémon no encontrado');
      }
      const data = await response.json();
      setPokemonData(data);

      // Fetch species data to get evolution chain URL
      const speciesResponse = await fetch(data.species.url);
      const speciesData = await speciesResponse.json();

      // Fetch evolution chain data
      const evolutionResponse = await fetch(speciesData.evolution_chain.url);
      const evolutionData = await evolutionResponse.json();

      // Extract evolution chain with levels
      const evolutions: EvolutionChain[] = [];
      let currentEvolution = evolutionData.chain;

      while (currentEvolution) {
        const evolutionName = currentEvolution.species.name;
        const evolutionResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${evolutionName}`);
        const evolutionPokemon = await evolutionResponse.json();

        evolutions.push({
          name: evolutionName,
          sprite: evolutionPokemon.sprites.front_default,
          minLevel: currentEvolution.evolution_details[0]?.min_level || null,
        });

        currentEvolution = currentEvolution.evolves_to[0];
      }

      setEvolutionChain(evolutions);
    } catch (err) {
      setError('No se pudo encontrar el Pokémon o su cadena evolutiva');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Buscador de Pokémon</h1>
      <input
        type="text"
        value={pokemonName}
        onChange={(e) => setPokemonName(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Ingresa el nombre del Pokémon"
        style={{ padding: '8px', fontSize: '16px' }}
      />
      <button onClick={handleSearch} style={{ marginLeft: '10px', padding: '8px 16px', fontSize: '16px' }}>
        Buscar
      </button>

      {loading && <p>Cargando...</p>}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {pokemonData && (
        <div style={{ marginTop: '20px' }}>
          <h2>{pokemonData.name.charAt(0).toUpperCase() + pokemonData.name.slice(1)}</h2>
          <img src={pokemonData.sprites.front_default} alt={pokemonData.name} />
          <h3>Habilidades:</h3>
          <ul>
            {pokemonData.abilities.map((ability, index) => (
              <li key={index}>{ability.ability.name}</li>
            ))}
          </ul>
          <h3>Tipos:</h3>
          <ul>
            {pokemonData.types.map((type, index) => (
              <li key={index}>{type.type.name}</li>
            ))}
          </ul>
        </div>
      )}

      {evolutionChain.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Línea Evolutiva:</h3>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {evolutionChain.map((evo, index) => (
              <div key={index} style={{ margin: '0 10px', textAlign: 'center' }}>
                <p>{evo.name.charAt(0).toUpperCase() + evo.name.slice(1)}</p>
                <img src={evo.sprite} alt={evo.name} />
                {evo.minLevel !== null && <p>Evoluciona al nivel {evo.minLevel}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
