# mesos-stats-helper
A tiny GUI to show Mesos tasks, CPU &amp; memory usage by slave

## Usage

### Run with docker:

`docker run -p 3000:3000 argussecurity/mesos-stats-helper`

### Run locally:

`npm start`

### Available environment variables (set to override): 
* MASTER_HOST (default: master.mesos)
* MASTER_PORT (default: 5050) 

(for example: `docker run -e MESOS_HOST=localhost -e MESOS_PORT=5050 -p 3000:3000 argussecurity/mesos-stats-helper`)