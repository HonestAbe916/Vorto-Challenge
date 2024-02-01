const fs = require('fs');
const MAX_MINUTES = 12 * 60;
const STARTING_POINT = [0, 0];

const readInput = (inputPath) => {
    const input = fs.readFileSync(inputPath, 'utf-8').trim().split('\n');
    const loads = input.map((line, k) => {
        if (k === 0) return false;
        const [id, pickup, dropoff] = line.split(' ');
        const pickupCoords = pickup.substring(1, pickup.length - 1).split(',').map(Number);
        const dropoffCoords = dropoff.substring(1, dropoff.length - 1).replace("/[\n\r\t\s]+/g", "").replace(")", "").split(',').map(Number);
        return {
            id: Number(id),
            pickup: pickupCoords,
            dropoff: dropoffCoords,
            assigned: false,
        };
    }).filter((l) => l);
    return loads;
};

const ALL_LOADS = readInput(process.argv[2]);

const getLoad = (loadId) => {
    return ALL_LOADS.find(l => l.id === loadId);
};

const calculateDistance = (point1, point2) => {
    return Math.sqrt((point2[0] - point1[0]) ** 2 + (point2[1] - point1[1]) ** 2);
};

const calculateTotalTime = (currentTruck, newLoad) => {
    let dist = 0;
    let lastDropoffLoad = null;
    currentTruck.forEach((loadId) => {
        const load = getLoad(loadId);
        dist += lastDropoffLoad ? calculateDistance(load.pickup, lastDropoffLoad.dropoff) : calculateDistance(load.pickup, STARTING_POINT);
        dist += calculateDistance(load.dropoff, load.pickup);
        lastDropoffLoad = load;
    });

    if (newLoad) {
        dist += calculateDistance(newLoad.pickup, lastDropoffLoad.dropoff);
        dist += calculateDistance(newLoad.dropoff, newLoad.pickup);
        dist += calculateDistance(STARTING_POINT, newLoad.dropoff);     
    } else {
        dist += calculateDistance(STARTING_POINT, lastDropoffLoad.dropoff);   
    }
   
    return dist;
} 

const getFirstAvalibleLoad = () => {
    return ALL_LOADS.find((l) => l.assigned === false);
}

const getBestMatchingLoad = (currentTruck) => {
    let bestLoad = null;
    let shortestDist = 0;
    ALL_LOADS.filter((l) => l.assigned === false).forEach((l) => {
        const timeToRunRoute = calculateTotalTime(currentTruck, l);
        const extraTimeAdded = timeToRunRoute - calculateTotalTime(currentTruck);
        const timeToCompleteNewTruck = calculateTotalTime([l.id]);
        // if we are saving time by using current truck vs new truck and its the best load so far
        if ((timeToRunRoute < MAX_MINUTES) && (extraTimeAdded < timeToCompleteNewTruck) && (shortestDist === 0 || timeToRunRoute < shortestDist)) {
            bestLoad = l;
            shortestDist = timeToRunRoute;
        }
    });

    return bestLoad;
}

const getNextBestLoad = (currentTruck) => {
    if (!currentTruck.length) return getFirstAvalibleLoad();
    return getBestMatchingLoad(currentTruck);
}

const vrp = [];
let loadsToAssign = ALL_LOADS.filter((l) => l.assigned === false);
let currentTruck = [];

while (loadsToAssign.length) {
    const nextBestLoad = getNextBestLoad(currentTruck);
    if (!nextBestLoad) {
        vrp.push(currentTruck);
        currentTruck = [];
    } else {
        nextBestLoad.assigned = true;
        currentTruck.push(nextBestLoad.id);
    }

    loadsToAssign = ALL_LOADS.filter((l) => l.assigned === false);
}

if (currentTruck.length) {
    vrp.push(currentTruck);
}

vrp.forEach((loadList) => {
    process.stdout.write("[");
    process.stdout.write(loadList.join(","));
    process.stdout.write("]\n");
});



