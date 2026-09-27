# Shelf

Minimalistyczny tracker czytania: dodajesz książkę po ISBN, dostajesz okładkę i podstawowe dane, potem przesuwasz pasek postępu.

Dane trzymane są lokalnie w `data/library.json` (plik powstaje po pierwszym dodaniu książki).

## Uruchomienie

```bash
npm install
npm run dev
```

Otwórz [http://localhost:3000](http://localhost:3000).

## Jak sprawdzić, że działa

1. Na stronie głównej wpisz ISBN, np. `9780140328721` (Fantastic Mr. Fox) albo dowolny ISBN z książki, którą masz pod ręką — z myślnikami lub bez.
2. Kliknij **Szukaj**. Powinien pojawić się tytuł, autor i okładka z Open Library (z fallbackiem na Google Books).
3. Kliknij **Dodaj na półkę**. Zostaniesz przeniesiony na kartę książki.
4. Ustaw status na **Czytam** i przesuń suwak stron. Wróć na `/` — karta powinna pokazywać pasek postępu, a filtr **Czytam** tę pozycję.
5. Oznacz **Przeczytane** — postęp skacze do 100% (jeśli katalog zna liczbę stron).
6. Lookup bez UI: `http://localhost:3000/api/isbn/9780140328721` powinien zwrócić JSON z `title`, `authors` i `coverUrl`.

Jeśli ISBN nie istnieje w katalogach, zobaczysz komunikat *Nie znaleziono książki dla tego ISBN.*
