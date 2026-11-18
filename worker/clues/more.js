// Categorías extra (cada una con 5 pistas, de la más fácil a la más difícil: [pista, respuesta]).
const c = (name, clues) => ({ name, clues });

export const MORE = {
  jalisco: [
    c('Charrería', [
      ['Sombrero de ala ancha que usa el charro.', 'El sombrero charro'],
      ['Disciplina de la charrería en la que equipos de mujeres montan a caballo con vestidos largos.', 'La escaramuza'],
      ['Cuerda con la que el charro realiza las suertes de floreo y lazo.', 'La reata'],
      ['Suerte charra en la que el jinete derriba al toro jalándolo de la cola.', 'El coleadero'],
      ['La UNESCO declaró la charrería Patrimonio Cultural Inmaterial de la Humanidad en este año.', '2016'],
    ]),
    c('Fiestas y festivales de Jalisco', [
      ['Mes en que Guadalajara celebra sus Fiestas tradicionales con feria y desfiles.', 'Octubre'],
      ['Baile folclórico considerado el baile nacional de México, originario de Jalisco.', 'El jarabe tapatío'],
      ['Festival que cada año reúne a las estrellas del cine iberoamericano en Guadalajara.', 'El Festival de Cine de Guadalajara'],
      ['Mes en que comienza la Feria Internacional del Libro de Guadalajara.', 'Noviembre'],
      ['Encuentro que reúne cada año a los mejores mariachis en Guadalajara, a finales de agosto.', 'El Encuentro del Mariachi'],
    ]),
    c('Historia de Jalisco', [
      ['En 1810 este cura abolió la esclavitud desde Guadalajara.', 'Miguel Hidalgo'],
      ['Conquistador español que le dio a Guadalajara el nombre de su ciudad natal.', 'Nuño de Guzmán'],
      ['Conflicto entre el gobierno y los católicos entre 1926 y 1929, muy fuerte en Los Altos de Jalisco.', 'La Guerra Cristera'],
      ['En 1858, en el Palacio de Gobierno de Guadalajara, Guillermo Prieto le salvó la vida a este presidente diciendo "Los valientes no asesinan".', 'Benito Juárez'],
      ['Antiguo reino colonial con capital en Guadalajara.', 'La Nueva Galicia'],
    ]),
  ],

  mexico: [
    c('Presidentes de México', [
      ['Primer presidente indígena de México, de origen zapoteco.', 'Benito Juárez'],
      ['Presidente que expropió el petróleo en 1938.', 'Lázaro Cárdenas'],
      ['Primer presidente de México, en 1824.', 'Guadalupe Victoria'],
      ['Presidente que gobernó por más de 30 años en un periodo llamado Porfiriato.', 'Porfirio Díaz'],
      ['En 1913 fue presidente de México solo unos 45 minutos.', 'Pedro Lascuráin'],
    ]),
    c('Revolución Mexicana', [
      ['Líder del Ejército Libertador del Sur con el lema "Tierra y Libertad".', 'Emiliano Zapata'],
      ['Jefe de la División del Norte.', 'Francisco Villa'],
      ['Documento de 1910 que llamó a levantarse en armas contra Porfirio Díaz el 20 de noviembre.', 'El Plan de San Luis'],
      ['Presidente asesinado en 1913 tras la Decena Trágica.', 'Francisco I. Madero'],
      ['Ley suprema promulgada en 1917 que sigue vigente.', 'La Constitución de 1917'],
    ]),
    c('Culturas prehispánicas', [
      ['Pueblo que fundó México-Tenochtitlan.', 'Los mexicas'],
      ['Cultura que construyó Chichén Itzá.', 'Los mayas'],
      ['Conquistador español que derrotó a los mexicas en 1521.', 'Hernán Cortés'],
      ['Cultura de la costa del Golfo famosa por sus cabezas colosales de piedra.', 'Los olmecas'],
      ['Ciudad cercana a la Ciudad de México con las pirámides del Sol y de la Luna.', 'Teotihuacán'],
    ]),
    c('Patrimonio de México', [
      ['Zona arqueológica de Yucatán con la pirámide de Kukulcán.', 'Chichén Itzá'],
      ['Ciudad de Guanajuato famosa por su Callejón del Beso.', 'Guanajuato'],
      ['Antigua ciudad zapoteca sobre un cerro cerca de Oaxaca.', 'Monte Albán'],
      ['Insecto cuya reserva de hibernación en Michoacán es Patrimonio Mundial.', 'La mariposa monarca'],
      ['Península donde está la Sierra de San Francisco, con pinturas rupestres Patrimonio Mundial.', 'Baja California'],
    ]),
  ],

  cine: [
    c('Época de Oro del cine mexicano', [
      ['Comediante de "Ahí está el detalle", conocido como "el mimo de México".', 'Cantinflas'],
      ['Actor de "Nosotros los pobres" (1948), ídolo del cine mexicano.', 'Pedro Infante'],
      ['Actriz protagonista de "María Candelaria" (1943).', 'Dolores del Río'],
      ['Director apodado "El Indio" que dirigió "María Candelaria".', 'Emilio Fernández'],
      ['Comediante pachuco apodado "Tin Tan".', 'Germán Valdés'],
    ]),
    c('Directores famosos', [
      ['Director de "Titanic" y "Avatar".', 'James Cameron'],
      ['Director de "Tiburón" y "E.T.".', 'Steven Spielberg'],
      ['Director de "Psicosis" y "Los pájaros", maestro del suspenso.', 'Alfred Hitchcock'],
      ['Hermanas que dirigieron "Matrix".', 'Las hermanas Wachowski'],
      ['Director mexicano de "Birdman" y "El renacido".', 'Alejandro G. Iñárritu'],
    ]),
    c('Sagas de cine', [
      ['Saga que empezó con "Una nueva esperanza" en 1977.', 'Star Wars'],
      ['Saga donde un anillo debe destruirse en el Monte del Destino.', 'El Señor de los Anillos'],
      ['Saga del agente secreto con licencia para matar, 007.', 'James Bond'],
      ['Saga de ciencia ficción con un robot interpretado por Arnold Schwarzenegger que repite "Volveré".', 'Terminator'],
      ['Saga iniciada en 2001 sobre carreras callejeras y autos.', 'Rápidos y Furiosos'],
    ]),
    c('Premios Óscar', [
      ['Nombre de la estatuilla dorada que premia al mejor cine.', 'El Óscar'],
      ['Película de Pixar sobre el Día de Muertos que ganó el Óscar a Mejor Película Animada en 2018.', 'Coco'],
      ['Primer mexicano en ganar el Óscar a Mejor Director, en 2014 por "Gravedad".', 'Alfonso Cuarón'],
      ['Película de 1997 que ganó 11 premios Óscar.', 'Titanic'],
      ['Actor nacido en Chihuahua que ganó dos Óscar, por "¡Viva Zapata!" y "Sed de vivir".', 'Anthony Quinn'],
    ]),
  ],

  tv: [
    c('El Chavo del 8', [
      ['Niña de coletas y pecas, hija de Don Ramón.', 'La Chilindrina'],
      ['Personaje que siempre huye de pagarle la renta al señor Barriga.', 'Don Ramón'],
      ['Niño de traje de marinero y mejillas infladas.', 'Quico'],
      ['Dueño de la vecindad que viene a cobrar la renta.', 'El señor Barriga'],
      ['Actriz que dio vida a Doña Florinda.', 'Florinda Meza'],
    ]),
    c('Series de streaming', [
      ['Serie de Netflix con niños en Hawkins y una chica llamada Eleven.', 'Stranger Things'],
      ['Serie de dragones, tronos y el lema "Winter is coming".', 'Game of Thrones'],
      ['Serie en la que un profesor de química se vuelve fabricante de metanfetamina.', 'Breaking Bad'],
      ['Serie española de un atraco a la Fábrica de Moneda con "El Profesor".', 'La casa de papel'],
      ['Serie coreana de juegos mortales con trajes rojos y guardias con máscaras de figuras geométricas.', 'El juego del calamar'],
    ]),
    c('Series clásicas', [
      ['Serie médica de la doctora Meredith Grey.', 'Grey\'s Anatomy'],
      ['Serie animada de Peter Griffin y su familia de Quahog.', 'Padre de familia'],
      ['Serie sobre un genio de la física llamado Sheldon Cooper.', 'The Big Bang Theory'],
      ['Serie en la que Will Smith se muda con sus tíos ricos.', 'El príncipe del rap'],
      ['Serie sobre un médico gruñón del hospital Princeton-Plainsboro.', 'Dr. House'],
    ]),
  ],

  musica: [
    c('Rock en español', [
      ['Banda mexicana de "Gimme tha Power" y "¿Dónde jugarán las niñas?".', 'Molotov'],
      ['Banda mexicana de "Labios rotos".', 'Zoé'],
      ['Banda argentina de Gustavo Cerati, autora de "De música ligera".', 'Soda Stereo'],
      ['Banda de Alex Lora conocida como "El Tri".', 'El Tri'],
      ['Grupo mexicano de "La ingrata" y "Eres".', 'Café Tacvba'],
    ]),
    c('Reyes y reinas del pop', [
      ['Cantante de "Shake It Off" y "Love Story".', 'Taylor Swift'],
      ['Cantante de "Like a Virgin" y "Vogue".', 'Madonna'],
      ['Cantante de "Bad Romance" y "Poker Face".', 'Lady Gaga'],
      ['Cantante británica de "Rolling in the Deep".', 'Adele'],
      ['Cantante británico de "Shape of You".', 'Ed Sheeran'],
    ]),
    c('Instrumentos', [
      ['Instrumento de seis cuerdas que se toca con las manos.', 'La guitarra'],
      ['Instrumento de teclas blancas y negras.', 'El piano'],
      ['Guitarra pequeña de fondo abombado que usan los mariachis.', 'La vihuela'],
      ['Instrumento grande y de sonido grave del mariachi.', 'El guitarrón'],
      ['Instrumento de viento de madera con lengüeta doble, de sonido nasal.', 'El oboe'],
    ]),
    c('Voces de México', [
      ['Cantante apodado "El Charro de Huentitán".', 'Vicente Fernández'],
      ['Cantante apodado "El Sol de México".', 'Luis Miguel'],
      ['Cantante de "Amor a la mexicana".', 'Thalía'],
      ['Cantante mexicana de "Hasta la raíz".', 'Natalia Lafourcade'],
      ['Intérprete costarricense-mexicana de "La Llorona".', 'Chavela Vargas'],
    ]),
  ],

  ciencia: [
    c('Reino animal', [
      ['Mamífero más grande del mundo.', 'La ballena azul'],
      ['Ave que no vuela y vive en la Antártida.', 'El pingüino'],
      ['Anfibio mexicano capaz de regenerar sus extremidades.', 'El ajolote'],
      ['Animal terrestre más veloz del mundo.', 'El guepardo'],
      ['Número de corazones que tiene un pulpo.', 'Tres'],
    ]),
    c('Tabla periódica', [
      ['Símbolo químico del oro.', 'Au'],
      ['Elemento más abundante del universo.', 'El hidrógeno'],
      ['Símbolo químico del sodio.', 'Na'],
      ['Elemento de número atómico 6, base de la vida.', 'El carbono'],
      ['Símbolo químico del hierro.', 'Fe'],
    ]),
    c('Planeta Tierra', [
      ['Océano más grande del planeta.', 'El Pacífico'],
      ['Montaña más alta del mundo sobre el nivel del mar.', 'El Everest'],
      ['Desierto cálido más grande del mundo.', 'El Sahara'],
      ['Continente con más países.', 'África'],
      ['Punto más profundo de los océanos, en el Pacífico.', 'La Fosa de las Marianas'],
    ]),
    c('Grandes inventos', [
      ['Inventor del teléfono en 1876.', 'Alexander Graham Bell'],
      ['Inventor estadounidense de la bombilla eléctrica práctica.', 'Thomas Edison'],
      ['Mexicano que inventó un sistema de televisión a color.', 'Guillermo González Camarena'],
      ['Alemán que inventó la imprenta de tipos móviles.', 'Johannes Gutenberg'],
      ['Científico británico que inventó la World Wide Web.', 'Tim Berners-Lee'],
    ]),
  ],

  deportes: [
    c('Mundiales de futbol', [
      ['Selección campeona del Mundial de Sudáfrica 2010.', 'España'],
      ['Selección que ganó el Mundial de 1998 jugando de local.', 'Francia'],
      ['Estadio de la Ciudad de México que fue sede de dos finales mundialistas.', 'El Estadio Azteca'],
      ['Año del Mundial de México en el que Maradona anotó "la mano de Dios".', '1986'],
      ['Selección campeona del Mundial de Brasil 2014.', 'Alemania'],
    ]),
    c('Juegos Olímpicos', [
      ['Ciudad francesa sede de los Juegos Olímpicos de 2024.', 'París'],
      ['Ciudad donde se celebraron los Juegos Olímpicos de 1968.', 'Ciudad de México'],
      ['Los cinco aros olímpicos representan esto.', 'Los cinco continentes'],
      ['País del velocista Usain Bolt.', 'Jamaica'],
      ['Primera mujer mexicana en ganar una medalla de oro olímpica, en halterofilia, Sídney 2000.', 'Soraya Jiménez'],
    ]),
    c('Atletas mexicanos', [
      ['Portero mexicano apodado "Memo", presente en varios Mundiales.', 'Guillermo Ochoa'],
      ['Delantero mexicano apodado "Chicharito".', 'Javier Hernández'],
      ['Defensa mexicano que ganó dos Champions League con el Barcelona.', 'Rafael Márquez'],
      ['Velocista que ganó plata en los 400 metros en Atenas 2004.', 'Ana Gabriela Guevara'],
      ['Caminante que ganó el oro en los 20 km de marcha en Montreal 1976.', 'Daniel Bautista'],
    ]),
    c('Deportes y reglas', [
      ['Deporte en el que se juegan Wimbledon y Roland Garros.', 'El tenis'],
      ['Deporte en el que se habla de strikes, bateadores y home runs.', 'El béisbol'],
      ['Deporte cuya gran final es el Super Bowl.', 'El futbol americano'],
      ['Deporte en el que se habla de birdies, bogeys y hoyos.', 'El golf'],
      ['Número de jugadores por equipo en la cancha en voleibol.', 'Seis'],
    ]),
  ],

  general: [
    c('Banderas del mundo', [
      ['País cuya bandera tiene una hoja de maple roja.', 'Canadá'],
      ['País cuya bandera es un círculo rojo sobre fondo blanco.', 'Japón'],
      ['País de bandera roja con una estrella amarilla de cinco puntas.', 'Vietnam'],
      ['País con una bandera cuadrada, cruz blanca sobre fondo rojo.', 'Suiza'],
      ['País cuya bandera es la única del mundo que no es rectangular ni cuadrada.', 'Nepal'],
    ]),
    c('Literatura', [
      ['Autor de "Don Quijote de la Mancha".', 'Miguel de Cervantes'],
      ['Colombiano autor de "Cien años de soledad".', 'Gabriel García Márquez'],
      ['Escritor checo autor de "La metamorfosis".', 'Franz Kafka'],
      ['Dramaturgo inglés autor de "Romeo y Julieta".', 'William Shakespeare'],
      ['Autor francés de "El principito".', 'Antoine de Saint-Exupéry'],
    ]),
    c('Segunda Guerra Mundial', [
      ['Año en que terminó la Segunda Guerra Mundial.', '1945'],
      ['Líder del partido nazi en Alemania.', 'Adolf Hitler'],
      ['Ciudades japonesas atacadas con bombas atómicas en 1945.', 'Hiroshima y Nagasaki'],
      ['Desembarco aliado de 1944 en las playas de Francia.', 'El Día D (Normandía)'],
      ['Unidad de la Fuerza Aérea Mexicana que combatió en Filipinas en 1945.', 'El Escuadrón 201'],
    ]),
    c('Mitología griega', [
      ['Dios griego del trueno y rey del Olimpo.', 'Zeus'],
      ['Diosa griega de la sabiduría.', 'Atenea'],
      ['Dios griego del mar.', 'Poseidón'],
      ['Monstruo con serpientes en lugar de cabello que convertía en piedra.', 'Medusa'],
      ['Héroe griego que cumplió doce trabajos.', 'Hércules'],
    ]),
    c('Comida del mundo', [
      ['País de origen de la pizza.', 'Italia'],
      ['País de origen del sushi.', 'Japón'],
      ['País de origen de la paella.', 'España'],
      ['País del que proviene el kimchi.', 'Corea'],
      ['País de origen de la moussaka.', 'Grecia'],
    ]),
  ],
};

// Pistas finales extra: [categoría, pista, respuesta].
export const MORE_FINALS = [
  ['Historia de México', 'Este militar firmó los Tratados de Córdoba en 1821 y luego se coronó emperador.', 'Agustín de Iturbide'],
  ['Ciencia mexicana', 'Este mexicano ganó el Premio Nobel de Química en 1995 por sus estudios sobre la capa de ozono.', 'Mario Molina'],
  ['Geografía', 'Es el único país del mundo que ocupa todo un continente.', 'Australia'],
  ['Literatura mexicana', 'En esta novela de Juan Rulfo, un hombre llega al pueblo de Comala en busca de su padre.', 'Pedro Páramo'],
  ['Cine mexicano', 'Esta película de 2000 de Alejandro González Iñárritu mezcla tres historias unidas por un accidente de auto.', 'Amores perros'],
  ['Música mexicana', 'Esta canción de José Alfredo Jiménez dice: "Con dinero y sin dinero hago siempre lo que quiero".', 'El rey'],
  ['Deportes', 'Este boxeador de Ciudad Obregón, apodado "El César del Boxeo", fue campeón mundial en tres divisiones.', 'Julio César Chávez'],
  ['Telenovelas', 'Esta telenovela de 1979, con Verónica Castro, fue un éxito mundial, incluso en Rusia.', 'Los ricos también lloran'],
  ['Historia universal', 'Este muro, que dividía una ciudad alemana, cayó en 1989.', 'El Muro de Berlín'],
  ['Arte', 'Este pintor español creó el "Guernica" en 1937.', 'Pablo Picasso'],
  ['Naturaleza', 'Este volcán mexicano, también llamado Volcán de Fuego, está en Colima.', 'El Volcán de Colima'],
  ['Cocina mexicana', 'Esta salsa poblana lleva chile y chocolate, y se sirve con pollo.', 'El mole poblano'],
  ['Ciencia', 'Este físico formuló la teoría de la relatividad.', 'Albert Einstein'],
  ['Tecnología', 'Esta empresa de Cupertino presentó el primer iPhone en 2007.', 'Apple'],
];
