# Vad ær detta?
Detta ær en workshop om DevContainers før Bekk 2023.

# Setup
Lasta ned VsCode och verifisera att du har docker installert:
`docker version`, `docker compose version`
Clona detta repoet och øppna det i VsCode.
Lasta ned devContainer extension - `CMD-SHIFT-P -> Install extensions -> DevContainers`

Det var inte mer æn det - nu kan vi køra igång!

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


Servern startade också om nær vi ændrade filerna. Detta ær något "custom" som inte ær en del av sjælva bas-containern men som _noen_ som har lite pejling har fikset. Detta fick vi till med att
installera `nodemon` som en del av `devDependencies`
och så kan vi bruka `npx` (node package execute) som var førinstallerat i den `node:latest` som vi anvænda.

3. Om du nu kør `docker ps -a` i en terminal som inte ær inuti VSCode så borde du också se att det finns en container som kør med din kod. Så dær har vi docker containern.

4. Sætt en breakpoint i koden (`index.js`) genom att klicka ute i marginalen på linje 31. Testa nu att klicka på den "Play-knappen" med en liten "bug" på och sen på "Launch Program". Vi ser att debugging fungerar också. Ta nu en liten funderare på hur detta kan fungera egentligen.. Vi har inte installerat något i Docker imagen førutom Node, men vi verkar ændå kunna sætta breakpoints och køra koden från VsCode. Det måste vara något mer som hænder nær vi startar devContainern.


Vi førsøker nu samla ihop gruppen før gemensam reflektion innan vi går vidare.

>Uppsamling Del 1

## Del 2
Okej, hæftigt! Men detta ær ikke så långt ifrån att bara installera node på maskinen och bara køra npm install sjælv, vad ska vi med all denna extra komplexiteten till?

Låt oss sæga att appen trenger en database i tillægg. Da kan man jo skriva en beskrivelse i README om hvordan man installerar postgres og hvordan man kobbler seg till den osv yadayada...

 Men vi brukar ju devContainers! Vi måste ju kunna bygga in detta i devContainern på en eller annan måte?

Det førsta steget ær att vi ju vill ha en postgres database som kan køra i Docker (vi har ju bara VsCode och Docker som dependencies).
Detta kan man fint finna på dockerhub, næmligen bara `postgres:latest`.
Da kan vi laga en `Dockerfile.pg` som innehåller postgres, och lægga den vid sidan av den tidigare Dockerfile'n.

_Diskutera med partner_
Ær det något speciellt med denna postgres imagen? Eller ær det så att vi egentligen bara vill spinna upp en helt sjælvstændig postgres databas "vid sidan" av dær vår huvud-devContainer kjør?

 _Svaret ær att det ræcker med en vanlig postgres image._
### Installera postgres i en dockerfil
Låt oss se om vi kan få det till..
Innehållet i `Dockerfile.pg` kan se sån ut:
```Dockerfile
FROM postgres:latest
COPY ./pg_init/*.sql /docker-entrypoint-initdb.d
```
Laga också en folder under `.devcontainer` som
dere kaller `pg_init` med føljande SQL fil i:

_Placeras inuti `.devcontainer/pg_init/init.sql`_
```sql
-- This script seeds the 'example_db' database with sample data

-- Create the 'users' table if it does not exist
-- The table structure: id (SERIAL PRIMARY KEY), name (VARCHAR), email (VARCHAR)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100)
);

-- Inserting sample data into the 'users' table
INSERT INTO users (name, email) VALUES ('Jule Nisse', 'julenisse@polar.no');
INSERT INTO users (name, email) VALUES ('Jule Maja', 'julemaja@polar.no');
INSERT INTO users (name, email) VALUES ('oh-deer', 'oh-deer@polar.no');

```
Okej! Nu har vi en `Dockerfile.pg` samt lite grejer før att initializera databasen med någon SQL.
Detta ær en liten digression, men detta ær ett trix som ær førvånansvært svårt att finna ut av.
Den vanliga "postgres" imagen från dockerhub har en feature som gør att den automatiskt kør SQL script som ligger
under `/docker-entrypoint-initdb.d` vilket ær något vi anvænder før att automatiskt få in en databas och lite
data. Hær kan man før en vanlig miljø seeda mer testdata osv om man vill det.

Nog om det - Nu ær frågan - Hur får vi startat både "devContainer" imagen, och postgres databasen och får
dem att snacka samman?
Det ær dags før Docker compose att gøra sitt intræde.

## Docker compose
Docker compsoe ær en vanlig tool før att spinna upp flera docker images bredvid varandra, och skapa
ett gemensamt nætverk som gør att de kan snacka med varandra øver sin "dockeriserade" localhost.
Detta låter komplicerat, men Docker compose gør det på ett ganska enkelt sætt.
Skapa filen `docker-compose.yml` under `.devcontainer/` med føljande innehåll:

```yaml
version: '3.8'

services:
  app:
    build: 
      context: .
      dockerfile: Dockerfile

    volumes:
      - ../..:/workspaces:cached
      
    # Overrides default command so things don't shut down after the process ends.
    command: sleep infinity

    # Runs app on the same network as the database container, allows "forwardPorts" in devcontainer.json function.
    network_mode: service:db-postgres

  db-postgres:
    build: 
      context: .
      dockerfile: Dockerfile.pg
    restart: unless-stopped
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_USER: postgres
      POSTGRES_DB: postgres
```
Førsøk studera filen lite snabbt. Det ær en del grejer hær, men det intressanta ær att vi skapar
en "app" och en "db-postgres" service, som lænkas ihop genom den "network_mode". Detta ær lite komplicerat, men man behøver bara
sætta upp det en gång. Hær ser vi också att vi explicit måste gøra den "bind mounten" från vår lokala directory in i "/workspaces.

Nu måste vi dock ændra lite i `devcontainer.json`. Det visar sig næmligen att `docker compose` ær støttat
av devContainer ramverket. Så nu kan vi ta bort "build" från `devcontainer.json` och lægga till `dockerComposeFile` istællet:
```json
{
	...
    //"build": {
    //    "dockerfile": "Dockerfile"
    //    }
	"dockerComposeFile": "docker-compose.yml",
    ...
}
```
Nu kan vi igen køra `CMD-SHIFT-P -> Rebuild Container Image Without Cache` før att se om vi gjort det riktigt.

Før att skapa en route till databasen, kan vi nu ændra `index.json` till føljande:
```js
const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = 3000;

// Database connection configuration
const pool = new Pool({
  user: 'postgres',    // replace with your database username
  host: 'localhost',
  database: 'postgres',
  password: 'postgres',  // replace with your database password
  port: 5432,
});
app.get('/', async (req, res) => {
  res.status(200).send("Hello there!");

});

app.get('/users', async (req, res) => {
  
  try {
    const client = await pool.connect();
    
    const result = await client.query('SELECT * FROM users');
    client.release();
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

```
Kør också `npm install pg` i terminalen inuti VSCode før att få installert `pg` pakken som brukas før att kobble seg mot postgres.
Om allt har blivit riktigt nå, så burde dere kunna besøka 
[localhost:3000/users](localhost:3000/users) før att
se att er web-app nu hentet informationen från databasen.
Sweet!

Nu har vi alltså i princip en færdig utvecklingsmiljø inpackad i .devcontainer foldern. Næste person som ska børja utveckla denna web-appen har nu inget behov før att gøra allt detta jobbet. Det enda instruktionen den behøver ær:
"In i projektet, kør `CMD-SHIFT-P -> Rebuild Container Without Cache` och sedan kør "npm start" i projektet før att komma igång. Om det ær någon ændring/problem som uppstår senare så kan den personen bara fixa det i devContainern så får alla andra anvændning av det direkt.

## Debugging fungerar væl?
Ja precis, det gør det. Testa att sætta en breakpoint i sidan på en rad, feks linje 22 och prøva att køra programmet.
Då borde du få en debugger som stannar på den linjen nær du besøker [localhost:3000/users](localhost:3000/users).

# Extrauppgave 1 - Extensions
Det kan också vara massa "utvecklingsverktyg" som du vet ær bra att ha nær man utvecklar just denna mikrotjenesten. Detta kan vara stress før en ny utvecklare att sætta upp korrekt eller ha kunskap om. Vi kan faktiskt bygga in detta i devContainern också.
i `devContainer.json` så finns konfigureringsblock før olika editors som støttar devContainer protokollet.

Testa att lægga in føljande i `devcontainer.json`:
```json
...
	"customizations": {
		// Configure properties specific to VS Code.
		"vscode": {
			"settings": {
				"editor.tabCompletion": "on"
			},
			"extensions": [
				"streetsidesoftware.code-spell-checker"
			]
			
		}
	},
    ...
```
Om vi nu bygger om containern så får vi inkluderat denna spell checkern i koden. Det finns førstås stød før att lægga
in alla møjliga extensions som vi vill ha tillgængliga.
Vi ser också settings før att "tabCompletion ska vara på.
Se också i mån av tid om du kan hitta någon annan extension som du kan tænka ær anvændbar.

# Extra uppgave 2 - Case (Svår)
Ni har behov før att debugga varfør appen inte får kontakt med postgres databasen ganska ofta, och se lite vad som faktiskt ligger i databasen. Du kænner till att det finns en tool som heter psql som kan anvændas før att snacka med en postgresdatabas. Førsøk lista ut hur man kan få installert `psql` i sjælva "huvud"-devcontainer så att man har den toolen tillgænglig før debugging vid utveckling.

_Tips 1:_ Man kan anvænda føljande før att installera psql i docker
```
RUN apt-get update \
    && apt-get install -y postgresql postgresql-contrib
``` 
_Tips 2:_ Man kan anvænda kommandot `psql postgresql://postgres:postgres@localhost:5432/postgres` før att koppla sig mot en postgresdatabas på port 5432
