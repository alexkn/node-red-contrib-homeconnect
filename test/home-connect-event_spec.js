/// <reference types="@types/mocha" />
const helper = require('./TestHelper');
const homeConnectEventNode = require('../nodes/home-connect-event.js');

helper.init(require.resolve('node-red'));

describe('home-connect-event Node', function () {

    afterEach(async function () {
        helper.unload();
    });

    it('should be loaded', async function () {
        var flow = [{ id: 'n1', type: 'home-connect-event', name: 'test name'}];
        await helper.load(homeConnectEventNode, flow);
        var n1 = helper.getNode('n1');

        n1.should.have.property('name', 'test name');
    });
});
