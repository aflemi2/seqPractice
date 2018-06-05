const chalk = require('chalk');
const Sequelize = require('sequelize');
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/my_db');

const User = conn.define('user', {
  name: Sequelize.STRING
}, {
  timestamps: false
});

const Building = conn.define('building', {
  name: Sequelize.STRING
}, {
  timestamps: false
});

const Apartment = conn.define('apartment', {
  number: Sequelize.STRING
}, {
  timestamps: false
});

//User can have an apartment in one or more building.
const usernames = ['moe', 'larry', 'curly'];
const buildings = ['368 CPW', '666 Fifth Ave', 'Faulty Towels'];
const apartments = ['6K', 'PH', '1C'];

Apartment.belongsTo(Building);
User.hasMany(Apartment, { as: 'apartments' });

let _k;

conn.sync({ force: true })
  .then(() => {
    const userPromises = Promise.all(usernames.map(name => User.create({ name })));
    const buildingPromises = Promise.all(buildings.map(name => Building.create({ name })));
    const apartmentPromises = Promise.all(apartments.map(number => Apartment.create({ number })));
    return Promise.all([userPromises, buildingPromises, apartmentPromises]);
  })
  .then(([users, buildings, apartments]) => {
    const [k, ph, c] = apartments;
    const [moe, larry, curly] = users;
    const [cpw, fifth, flty] = buildings;
    _k = k;
    return Promise.all([
      k.setBuilding(cpw),
      ph.setBuilding(fifth),
      c.setBuilding(flty),
      moe.setApartments([k, ph]),
      larry.setApartments(c)
    ]);
  })
  .then(()=> {
    return Building.findById(_k.buildingId);
  })
  // .then( k => {
  //   console.log(chalk.blue(la.name), ' mayor is ', la.mayor.name);
  //   return City.findById(_chicago.id,
  //     {
  //       include: [
  //         { model: User, as: 'mayor' }
  //       ]
  //     }
  //   );
  // })
  // .then( chicago => {
  //   console.log(chalk.blue(chicago.name), ' mayor is ', chicago.mayor.name);
  // });
