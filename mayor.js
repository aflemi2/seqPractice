// we’ve got three cities… nyc, la, chicago….
// each city can have a mayor… which is a user….
// our users are moe, larry and curly…
// moe is the mayor of LA, larry is the mayor of chicago… and currently… nyc has no mayor…

const chalk = require('chalk');
const Sequelize = require('sequelize');
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/my_db');

const City = conn.define('city', {
  name: Sequelize.STRING
}, {
  timestamps: false
});

const User = conn.define('user', {
  name: Sequelize.STRING
}, {
  timestamps: false
});

const Residence = conn.define('residence', {
  name: Sequelize.STRING
}, {
  timestamps: false
});

City.beforeUpdate((cityInstance) => {
  let mayor;
  Promise.resolve(User.findById(cityInstance.mayorId))
  .then( _mayor => {
    mayor = _mayor;
    return _mayor.getHomes();
  })
  .then(homes => {
      if(homes.length === 0){
        throw console.log(chalk.red('Mayor must live somewhere!'));
      }
      else
      {
        const match = homes.find(home => cityInstance.id === home.cityId);
        return match ? console.log(chalk.green(`${mayor.name} accepted as Mayor!`))
        :
        console.log(chalk.red(`The mayor must live in ${cityInstance.name}`));
      }
  });
});

const usernames = ['moe', 'larry', 'curly'];
const residences = ['ny house', 'la apartment', 'chitown mansion'];
const citynames = ['nyc', 'la', 'chicago'];

City.belongsTo(User, { as: 'mayor' });
Residence.belongsTo(City);
User.hasMany(Residence, { as: 'homes' });

let _la, _chicago;

conn.sync({ force: true })
  .then(() => {
    const userPromises = Promise.all(usernames.map(name => User.create({ name })));
    const cityPromises = Promise.all(citynames.map(name => City.create({ name })));
    const residencePromises = Promise.all(residences.map(name => Residence.create({ name })));
    return Promise.all([userPromises, cityPromises, residencePromises]);
  })
  .then(([users, cities, residences]) => {
    const [nyHouse, laApart, chiMansion] = residences;
    const [moe, larry, curly] = users;
    const [nyc, la, chicago] = cities;
    _la = la;
    _chicago = chicago;
    return Promise.all([
      nyHouse.setCity(nyc),
      laApart.setCity(la),
      chiMansion.setCity(chicago),
      moe.setHomes(residences),
      larry.setHomes(residences[0]),
      la.setMayor(moe),
      chicago.setMayor(larry)
    ]);
  })
  .then(()=> {
    return City.findById(_la.id,
      {
        include: [
          { model: User, as: 'mayor' }
        ]
      }
    );
  })
  .then( la => {
    console.log(chalk.blue(la.name), ' mayor is ', la.mayor.name);
    return City.findById(_chicago.id,
      {
        include: [
          { model: User, as: 'mayor' }
        ]
      }
    );
  })
  .then( chicago => {
    console.log(chalk.blue(chicago.name), ' mayor is ', chicago.mayor.name);
  });
