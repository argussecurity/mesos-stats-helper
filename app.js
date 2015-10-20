/**
 * List all mesos tasks by slave, and the CPU + memory usage
 * Usage:
 * 1. Set MESOS_HOST below
 * 2. npm install
 * 3. npm start
 */

var path = require('path');
var _ = require('lodash');
var express = require('express');
var request = require('request');

var app = express();

var MESOS_HOST = process.env['MASTER_HOST'] || 'master.mesos';
var MESOS_PORT = process.env['MASTER_PORT'] || '5050';


app.get('/api/status', function(req, res) {

  request('http://' + MESOS_HOST + ':' + MESOS_PORT + '/master/state.json', function (error, response, body) {

    if (!error && response.statusCode == 200) {
      var b = JSON.parse(body);

      var slaves = _.indexBy(_.filter(b.slaves, function(s) {
        return s.active == true;
      }), 'id');

      var tasks = _.union.apply(this, _.pluck(_.filter(b.frameworks, function(f) {
        return f.active == true;
      }), 'tasks'));

      tasks = transformPorts(tasks);
      var output = calculatedAllocatedResources(tasks, slaves);
      res.send(output);

    } else {
      console.log("Error:");
      console.log(error);
      res.status(500).send("Error. Check logs.");
    }

  });
});


app.use(express.static(path.join(__dirname, 'public')));


function calculatedAllocatedResources(tasks, slaves) {
  var output = {slaves: [], tasks: tasks};

  console.log(" ");
  console.log("========================================================");

  var tasksGroupedBySlaves = _.groupBy(tasks, function(t) {
    return t.slave_id;
  });

  Object.keys(slaves).forEach(function (slaveId) {
    var slave = slaves[slaveId];

    console.log("Slave: " + slaveId + "   hostname: " + slave.hostname);
    console.log("Slaves attributes: " + JSON.stringify(slave.attributes));

    var tasks = tasksGroupedBySlaves[slaveId];
    var reduced = _.reduce(tasks, function (agg, task) {
      agg.cpus += task.resources.cpus;
      agg.mem += task.resources.mem;
      return agg;
    }, {cpus: 0, mem: 0, disk: 0});

    slave.resources2 = {
      allocated: {cpus: reduced.cpus, mem: reduced.mem},
      free: {cpus: (slave.resources.cpus - reduced.cpus), mem: (slave.resources.mem - reduced.mem)}
    };
    output.slaves.push(slave);

    console.log("Running tasks: " + JSON.stringify(_.pluck(tasks, "name")));
    console.log("CPUs:   " + prettyPrintNum(slave.resources.cpus) + "      Allocated: " + prettyPrintNum(reduced.cpus) + "     (Free: " + prettyPrintNum(slave.resources.cpus - reduced.cpus) + ")");
    console.log("Memory: " + prettyPrintNum(slave.resources.mem) + "      Allocated: " + prettyPrintNum(reduced.mem) + "     (Free: " + prettyPrintNum(slave.resources.mem - reduced.mem) + ")");
    console.log("========================================================");
  });
  console.log(" ");

  return output;
}

function transformPorts(tasks) {
  return tasks.map(function(task) {
    task.resources2 = {ports: []};
    if (task.resources && task.resources.ports) {
      var ports = task.resources.ports.replace(/[ \[\]]/g, "").split(",").map(function(port) { return port.replace(/-.+/, "") });
      task.resources2 = {ports: ports};
    }
    return task;
  })
}


function prettyPrintNum(num) {
  return _.padLeft(_.round(num, 2), 5, ' ')
}


var server = app.listen(3000, function() {
  console.log('Express server listening on port ' + server.address().port);
});
