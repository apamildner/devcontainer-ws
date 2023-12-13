# Vad är detta?
Detta är en workshop om DevContainers för Bekk 2023.

# Setup
Lasta ned VsCode och verifisera att du har docker installert:
`docker version`, `docker compose version`
Clona detta repoet och öppna det i VsCode.
Lasta ned devContainer extension - `CMD-SHIFT-P -> Install extensions -> DevContainers`

Det var inte mer än det - nu kan vi köra igång!

# Hello world
Okej! Låt oss nu se om vi kan få detta upp och köra.
Om du nu står i projektet, så kan du köra `CMD-SHIFT-P` -> `Rebuild Container Without Cache`.
Så i terminalen inuti VSCode kan vi skriva `npm run start` för att
få kört programmet. Det som egentligen skjer nu är att du kör kommandot
inuti docker containern, du har alltså ikke noe installerat på din faktiska maskin.

Nu kan vi besöka [localhost:3000](localhost:3000) och se om det verkar fungera.
Förhåppningsvis fick du ett litet välkomstmeddelande.
Testa att edita `index.js`, och "refresha" websidan för att se ändringen direkt.

Nu kan vi reflektera lite över vad vi faktiskt har att göra med här..

Du har alltså editat din fil akkurat som den är på din maskin, men ändringen har blivit plukket opp
inuti docker container och blivit reflekterad *där inne*. Det samma gäller för övrigt alla filer i projektet, som
feks `package.json` osv.
1. Ta nu och diskutera med din partner - vad är det som skjer her egentligen?
Vi har ju ändrar filen här lokalt i VsCode, men den har uppenbarligen också syncats in i devContainern utan att
vi gjorde något speciellt. Magin ligger i `./devcontainer/devcontainer.json`.
 
 Hint: (varning för tung läsning, se TLDR nedanför annars): [docker bind mount](https://docs.docker.com/storage/bind-mounts/#start-a-container-with-a-bind-mount)

_TLDR_; 
>De docsa är nog mer eller mindre oläsliga med mindre man är väldigt insatt i docker. Men poängen är att när devContainern skapas
>så skapar vi också en "bind mount" eller en "levande" länk mellan våra lokala filer och filsystemet inuti i containern, dvs både den lokala maskinen och docker imagen ser samma mappestruktur och filer.

2. Vi kunde också börja utveckla direkt utan att behöva skriva `npm install` eller liknande. Kan du hitta var detta har konfigurerats i `devcontainer.json` som visar hur detta kan tänkas fungera?


Servern startade också om när vi ändrade filerna. Detta är något "custom" som inte är en del av själva bas-containern men som _noen_ som har lite pejling har fikset. Detta fick vi till med att
installera `nodemon` som en del av `devDependencies`
och så kan vi bruka `npx` (node package execute) som var förinstallerat i den `node:latest` som vi använda.

3. Om du nu kör `docker ps -a` i en terminal som inte är inuti VSCode så borde du också se att det finns en container som kör med din kod. Så där har vi docker containern.

4. Sätt en breakpoint i koden (`index.js`) genom att klicka ute i marginalen på linje 31. Stopp nu först processen vi startade tidigare med "npm run start". Testa nu att klicka på den "Play-knappen" med en liten "bug" på och sen på "Launch Program". Vi ser att debugging fungerar också. Ta nu en liten funderare på hur detta kan fungera egentligen.. Vi har inte installerat något i Docker imagen förutom Node, men vi verkar ändå kunna sätta breakpoints och köra koden från VsCode. Det måste vara något mer som händer när vi startar devContainern.


Vi försöker nu samla ihop gruppen för gemensam reflektion innan vi går vidare.

>Uppsamling Del 1

Om du är klar kan du försöka hjälpa noen annan grupp att komma igång

## Del 2
Okej, häftigt! Men detta är ikke så långt ifrån att bara installera node på maskinen och bara köra npm install själv, vad ska vi med all denna extra komplexiteten till?

Låt oss säga att appen trenger en database i tillägg. Da kan man jo skriva en beskrivelse i README om hur man installerar postgres og hur man kobbler seg till den osv yadayada...

 Men vi brukar ju devContainers! Vi måste ju kunna bygga in detta i devContainern på en eller annan måte?

Det första steget är att vi ju vill ha en postgres database som kan köra i Docker (vi har ju bara VsCode och Docker som dependencies).
Detta kan man fint finna på dockerhub, nämligen bara `postgres:latest`.
Da kan vi laga en `Dockerfile.pg` som innehåller postgres, och lägga den vid sidan av den tidigare Dockerfilen.

**_Diskutera med partnern:_**

är det något speciellt med denna postgres imagen? Eller är det så att vi egentligen bara vill spinna upp en helt självständig postgres databas "vid sidan" av där vår huvud-devContainer kjör?

 > Svaret är att det räcker med en vanlig postgres image.
### Installera postgres i en dockerfil
Låt oss se om vi kan få det till..
Innehållet i `Dockerfile.pg` kan se sån ut:
```Dockerfile
FROM postgres:latest
COPY ./pg_init/*.sql /docker-entrypoint-initdb.d
```
Laga också en folder under `.devcontainer` som
dere kaller `pg_init` med följande SQL fil i:

_Placeras inuti `.devcontainer/pg_init/init.sql`_
```sql
-- This script seeds the targeted database with sample data

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
Okej! Nu har vi en `Dockerfile.pg` samt lite grejer för att initializera databasen med någon SQL.
Detta är en liten digression, men detta är ett trix som är förvånansvärt svårt att finna ut av.
Den vanliga "postgres" imagen från dockerhub har en feature som gör att den automatiskt kör SQL script som ligger
under `/docker-entrypoint-initdb.d` vilket är något vi använder för att automatiskt få in en databas och lite
data. Här kan man för en vanlig miljö seeda mer testdata osv om man vill det.

Nog om det - Nu är frågan - Hur får vi startat både "devContainer" imagen, och postgres databasen och får
dem att snacka samman?
Det är dags för Docker compose att göra sitt inträde.

## Docker compose
Docker compsoe är en vanlig tool för att spinna upp flera docker images bredvid varandra, och skapa
ett gemensamt nätverk som gör att de kan snacka med varandra över sin "dockeriserade" localhost.
Detta låter komplicerat, men Docker compose gör det på ett ganska enkelt sätt.
Skapa filen `docker-compose.yml` under `.devcontainer/` med följande innehåll:

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
Försök studera filen lite snabbt. Det är en del grejer här, men det intressanta är att vi skapar
en "app" och en "db-postgres" service, som länkas ihop genom den "network_mode". Detta är lite komplicerat, men man behöver bara
sätta upp det en gång. Här ser vi också att vi explicit måste göra den "bind mounten" från vår lokala directory in i "/workspaces.

Nu måste vi dock ändra lite i `devcontainer.json`. Det visar sig nämligen att `docker compose` är stöttat
av devContainer ramverket. Så nu kan vi ta bort "build" från `devcontainer.json` och lägga till `dockerComposeFile` istället:
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
Nu kan vi igen köra `CMD-SHIFT-P -> Rebuild Container Image Without Cache` för att se om vi gjort det riktigt.

För att skapa en route till databasen, kan vi nu ändra `index.json` till följande:
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
Kör också `npm install pg` i terminalen inuti VSCode för att få installert `pg` pakken som brukas för att kobble seg mot postgres. NB: Detta är kun för att få in den i `package.json`,
den vill jo installeras automatiskt neste gang man tar upp containern.
Om allt har blivit riktigt nå, så burde dere kunna besöka 
[localhost:3000/users](localhost:3000/users) för att
se att er web-app nu hentet informationen från databasen.
Sweet!

Nu har vi alltså i princip en färdig utvecklingsmiljö inpackad i .devcontainer foldern. Näste person som ska börja utveckla denna web-appen har nu inget behov för att göra allt detta jobbet. Det enda instruktionen den behöver är:
"In i projektet, kör `CMD-SHIFT-P -> Rebuild Container Without Cache` och sedan kör "npm start" i projektet för att komma igång. Om det är någon ändring/problem som uppstår senare så kan den personen bara fixa det i devContainern så får alla andra användning av det direkt.

## Debugging fungerar fortfarande väl?
Ja precis, det gör det. Testa att sätta en breakpoint i sidan på en rad, feks linje 22 och pröva att köra programmet.
Då borde du få en debugger som stannar på den linjen när du besöker [localhost:3000/users](localhost:3000/users).

# Extrauppgave 1 - Extensions
Det kan också vara massa "utvecklingsverktyg" som du vet är bra att ha när man utvecklar just denna mikrotjenesten. Detta kan vara stress för en ny utvecklare att sätta upp korrekt eller ha kunskap om. Vi kan faktiskt bygga in detta i devContainern också.
i `devContainer.json` så finns konfigureringsblock för olika editors som stöttar devContainer protokollet.

Testa att lägga in följande i `devcontainer.json`:
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
Om vi nu bygger om containern så får vi inkluderat denna spell checkern i koden. Det finns förstås stöd för att lägga
in alla möjliga extensions som vi vill ha tillgängliga.
Vi ser också settings för att "tabCompletion ska vara på.
Se också i mån av tid om du kan hitta någon annan extension som du kan tänka är användbar.

# Extra uppgave 2 - Case uppgave (Svår)
Ni har behov för att debugga varför appen inte får kontakt med postgres databasen ganska ofta, och se lite vad som faktiskt ligger i databasen. Du känner till att det finns en tool som heter psql som kan användas för att snacka med en postgresdatabas. Försök lista ut hur man kan få installert `psql` i själva "huvud"-devcontainer så att man har den toolen tillgänglig för debugging vid utveckling.

_Tips 1:_ Man kan använda följande för att installera psql i docker
```
RUN apt-get update \
    && apt-get install -y postgresql postgresql-contrib
``` 
_Tips 2:_ Man kan använda kommandot `psql postgresql://postgres:postgres@localhost:5432/postgres` för att koppla sig mot en postgresdatabas på port 5432
