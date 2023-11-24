# Intro
Snacka om vad devContainers ær før något

# Setup
Lasta ned VsCode och verifisera att du har docker installert:
`docker version`, `docker compose version`
Det var det, och det ær det som ær poængen! Nu kør vi.
Du har antagligen klonat detta repoet, så det ær bra! :D 
Lasta ned devContainer extension - CMD-SHIFT-P -> Install extensions -> DevContainers

# Hello world
Okej! Låt oss nu se om vi kan få detta upp och køra.
Om du nu står i projektet, så kan du køra `CMD-SHIFT-P` -> `Rebuild Container Without Cache`.
Så i terminalen inuti VSCode kan vi skriva `npm run start` før att
få kørt programmet. Det som egentligen skjer nu ær att du kør kommandot
inuti docker containern, du har alltså ikke noe installerat på din faktiska maskin.

Nu kan vi besøka [localhost:3000](localhost:3000) och se om det verkar fungera.
Førhåppningsvis fick du ett litet vælkomstmeddelande.
Testa att edita `index.js`, och "refresha" websidan før att se ændringen direkt.

Nu kan vi reflektera lite øver vad vi faktiskt har att gøra med hær..

Du har alltså editat din fil akkurat som den ær på din maskin, men ændringen har blivit plukket opp
inuti docker container och blivit reflekterad *dær inne*. Det samma gæller før øvrigt alla filer i projektet, som
feks `package.json` osv.
1. Ta nu och diskutera med din partner - vad ær det som skjer her egentligen?
Vi har ju ændrar filen hær lokalt i VsCode, men den har uppenbarligen också syncats in i devContainern utan att
vi gjorde något speciellt. Magin ligger i `./devcontainer/devcontainer.json`.
 
 Hint: (varning før tung læsning, se TLDR nedanfør annars): [docker bind mount](https://docs.docker.com/storage/bind-mounts/#start-a-container-with-a-bind-mount)

_TLDR_; 
>De docsa ær nog mer eller mindre olæsliga med mindre man ær vældigt insatt i docker. Men poængen ær att nær devContainern skapas
>så skapar vi också en "bind mount" eller en "levande" lænk mellan våra lokala filer och filsystemet inuti i containern, dvs både den lokala maskinen och docker imagen ser samma mappestruktur och filer.

2. Vi kunde också børja utveckla direkt utan att behøva skriva `npm install` eller liknande. Kan du hitta var detta har konfigurerats i `devcontainer.json` som visar hur detta kan tænkas fungera?

Servern startade också om nær vi ændrade filerna. Detta ær något "custom" som inte ær en del av sjælva bas-containern men som jag har konfigurerat. Detta fick vi till med att
installera `nodemon` som en del av `devDependencies`
och så kan vi bruka `npx` (node package execute) som var førinstallerat i den bas-containern som vi anvænde (alltså det som står øverst i Dockerfile).

Vi førsøker nu samla ihop gruppen før gemensam reflektion innan vi går vidare.

# Uppsamling - vi tar en gemensam genomgång hær

## Forts
Okej, fett. Men detta ær ikke så långt ifrån att bara installera node på maskinen och bara køra npm install sjælv, vad ska vi med all denna extra komplexiteten till?
Låt oss sæga att appen trenger en database

# Lægg på en linter med extensions

# Anvænda docker compose istællet
Men vi har ju inget i databasen :O 
# Digression - postgres database seeding

# Experimentera lite
Testa att byta .devContainer fil med varandra eller noe?