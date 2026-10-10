% Malluminate knowledge base (works with SWI-Prolog and with the in-browser interpreter)

% ---- Facts: walkways between sections ----
connected(entrance, atrium).
connected(atrium, info).
connected(atrium, clothing).
connected(atrium, escalator).
connected(atrium, food).
connected(info, pharmacy).
connected(pharmacy, food).
connected(pharmacy, restroom).
connected(restroom, parking).
connected(food, restroom).
connected(food, cinema).
connected(food, cafe).
connected(clothing, shoes).
connected(clothing, escalator).
connected(escalator, electronics).
connected(escalator, cafe).
connected(electronics, books).
connected(books, kids).
connected(kids, cafe).
connected(cafe, cinema).
connected(cinema, parking).

% ---- Facts: what each section is ----
section(entrance, entrance).
section(atrium, hub).
section(info, service).
section(clothing, store).
section(shoes, store).
section(electronics, store).
section(books, store).
section(food, food).
section(cinema, fun).
section(pharmacy, service).
section(kids, fun).
section(restroom, facility).
section(escalator, hub).
section(parking, entrance).
section(cafe, food).

% ---- Facts: customers and what they like ----
likes(asha, clothing).
likes(ben, electronics).
likes(chen, cinema).
likes(dia, books).

% ---- Rules: walkways work in both directions ----
link(A, B) :- connected(A, B).
link(A, B) :- connected(B, A).

% ---- Rules: depth-first path (follows one branch until it must backtrack) ----
path(A, B, Path) :- walk(A, B, [A], Rev), reverse(Rev, Path).
walk(B, B, Visited, Visited).
walk(A, B, Visited, Path) :-
    link(A, N), \+ member(N, Visited),
    walk(N, B, [N|Visited], Path).

% ---- Rules: breadth-first shortest path (fewest walkways) ----
shortest_path(A, B, Path) :- bfs([[A]], B, [A], Rev), reverse(Rev, Path).
bfs([[B|T]|_], B, _, [B|T]).
bfs([[N|T]|Queue], B, Seen, Path) :-
    findall(M, (link(N, M), \+ member(M, Seen)), Ms),
    findall([M, N|T], member(M, Ms), New),
    append(Queue, New, Queue2),
    append(Ms, Seen, Seen2),
    bfs(Queue2, B, Seen2, Path).

% ---- Rules: simple AI-style reasoning ----
reachable(A, B) :- shortest_path(A, B, _).
suggest(Person, Store, Route) :- likes(Person, Store), shortest_path(entrance, Store, Route).
hops(A, B, N) :- shortest_path(A, B, P), length(P, L), N is L - 1.
crowd_level(N, low) :- N < 35.
crowd_level(N, medium) :- N >= 35, N < 65.
crowd_level(N, high) :- N >= 65.
discounted(Price, Percent, Final) :- Final is Price * (100 - Percent) / 100.
