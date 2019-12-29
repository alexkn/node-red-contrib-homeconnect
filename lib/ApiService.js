
module.exports = {
    getHost: (simulation_mode) => {
        if(simulation_mode) {
            return 'https://simulator.home-connect.com';
        } else {
            return 'https://api.home-connect.com';
        }
    }
};
