// the purpose of the daemon is: it's our global starting point.
// it handles several aspects of the game, primarily hacking for money.
// since it requires a robust "execute arbitrarily" functionality
// it serves as the launching point for all the helper scripts we need.
// this list has been steadily growing as time passes.

/*jshint loopfunc:true */

import { buildHelpers } from "/xeno/helpers.js";
import { buildServerList, Server } from "/xeno/server.js";
import { buildPortCrackingArray } from "/xeno/crack.js";

// some ancillary scripts that run asynchronously, we utilize the startup/execute capabilities of this daemon to run when able
//var asynchronousHelpers = [];

// --- VARS ---
// in debug mode, the targeting loop will always go for foodnstuff, the saddest little server
var isDebugMode = true;

// the server to use if we're in debug mode
var debugServer = "foodnstuff"; //"omega-net";

// complex arrays of servers with relevant properties, one is sorted for ram available, the other is for money
var serverListRam = [];
var serverListMoney = [];

// simple name array of servers that have been added
var addedServers = [];

// the port cracking array, we use this to do some things
var portCrackers = [];

// toolkit var for remembering the names and costs of the scripts we use the most
var tools = [];

// the name of the host of this daemon, so we don't have to call the function more than once.
var daemonHost = null;

// multipliers for player abilities
var mults = null;
var playerHackingMoneyMult = null;
var playerHackingGrowMult = null;

// bitnode multipliers that can be automatically set by SF-5
var bitnodeMults = null;
var bitnodeHackingMoneyMult = null;
var bitnodeGrowMult = null;
var bitnodeWeakenMult = null;

let asynchronousHelpers = [];

// script entry point
export async function main(ns) {
	// get the name of this node
	daemonHost = ns.getHostname();

	asynchronousHelpers = buildHelpers(ns);

	// create the exhaustive server list
	addedServers = buildServerList(ns);

	Object.values(addedServers).forEach((srv) => {
		const node = new Server(ns, srv);
		node.init();

		serverListMoney.push(node);
	});
	serverListRam = serverListMoney;

	// build port cracking array
	portCrackers = buildPortCrackingArray(ns);

	// build toolkit
	buildToolkit(ns);

	// figure out the various bitnode and player multipliers
	establishMultipliers(ns);

	// the actual worker processes live here
	await doTargetingLoop(ns);
}

// actual multipliers are expressed as functions
function actualGrowthMultiplier() {
	return playerHackingGrowMult * bitnodeGrowMult;
}

function actualHackMultiplier() {
	return playerHackingMoneyMult * bitnodeHackingMoneyMult;
}

function actualWeakenPotency() {
	return bitnodeWeakenMult * weakenThreadPotency;
}

function isAnyServerRunning(scriptName) {
	for (var s = 0; s < serverListRam.length; s++) {
		var server = serverListRam[s];
		if (server.hasRunningScript(scriptName)) {
			return true;
		}
	}
	return false;
}

function whichServerIsRunning(scriptName) {
	for (var s = 0; s < serverListRam.length; s++) {
		var server = serverListRam[s];
		if (server.hasRunningScript(scriptName)) {
			return server.name;
		}
	}
	return "";
}

async function runStartupScripts(ns) {
	var isEverythingAlreadyRunning = false;

	for (var h = 0; h < asynchronousHelpers.length; h++) {
		var helper = asynchronousHelpers[h];

		if (helper.isLaunched) continue;
		var scriptName = helper.name;
		if (isAnyServerRunning(scriptName)) {
			helper.isLaunched = true;
			continue;
		} else {
			var tool = getTool(helper.shortName, ns);

			ns.tprint(tool);

			helper.isLaunched = await arbitraryExecution(ns, tool, 1, []);

			if (helper.isLaunched) {
				ns.print(
					"Server " +
						whichServerIsRunning(scriptName) +
						" running " +
						scriptName
				);
			}
		}
	}
	// if every helper is launched already return "true" so we can skip doing this each cycle going forward.
	for (var c = 0; c < asynchronousHelpers.length; c++) {
		if (!asynchronousHelpers[c].isLaunched) {
			return false;
		}
	}
	return true;
}

async function doTargetingLoop(ns) {
	var isHelperListLaunched = false;

	while (true) {
		// sort the array so that already weakened servers have a high priority
		// while still taking their value into account
		sortServerList("money");

		// purchase as many servers with 1 TB as affordable, for extra umph.
		// I do this first for no real reason.
		detectChangesInDaemonHosts(ns);

		// run some auxilliary processes that ease the ram burden of this daemon
		// and add additional functionality (like managing hacknet or buying servers)
		if (!isHelperListLaunched) {
			isHelperListLaunched = await runStartupScripts(ns);
		}

		var currentTargets = 0;
		// check for servers that need to be rooted
		// simultaneously compare our current target to potential targets
		for (var i = 0; i < serverListMoney.length; i++) {
			var server = serverListMoney[i];
			// check if we have root
			if (!server.hasRoot()) {
				// if we don't, and we can, get it.
				if (server.canCrack()) {
					doRoot(server);
				}
			}
			// assume perhaps we just succeeded root
			if (
				currentTargets < maxTargets &&
				server.hasRoot() &&
				server.canHack() &&
				server.shouldHack()
			) {
				// now don't do anything to it until prep finishes, because it is in a resting state.
				if (server.isPrepping()) continue;

				// increment the target counter, consider this an optimal target
				currentTargets++;

				// if the target is in a resting state (we have scripts running against it), proceed to the next target.
				if (server.isTargeting()) continue;

				// perform weakening and initial growth until the server is "perfected"
				await prepServer(ns, server);

				// the server isn't optimized, this means we're out of ram from a more optimal target, fuck off
				if (
					server.security() > server.minSecurity ||
					server.money() < server.maxMoney
				)
					continue;

				// now don't do anything to it until prep finishes, because it is in a resting state.
				if (server.isPrepping()) continue;

				// adjust the percentage to steal until it's able to rapid fire as many as it can
				await optimizePerformanceMetrics(ns, server);

				// once conditions are optimal, fire barrage after barrage of cycles in a schedule
				await performScheduling(ns, server);
			}
		}

		await ns.sleep(1000);
	}
}

function establishMultipliers(ns) {
	// uncomment this at SF-5 to handle your bitnode multipliers for you
	// bitnodeMults = ns.getBitNodeMultipliers();

	// prior to SF-5, bitnodeMults stays null and these mults are set to 1.
	var isBitnodeMultsNull = bitnodeMults === null;

	// various bitnode mult setters:
	bitnodeHackingMoneyMult = isBitnodeMultsNull ? 1 : mults.ScriptHackMoney; //applying the multiplier directly to the player mult
	bitnodeGrowMult = isBitnodeMultsNull ? 1 : mults.ServerGrowthRate;
	bitnodeWeakenMult = isBitnodeMultsNull ? 1 : mults.ServerWeakenRate;

	// then do player multipliers:
	mults = ns.getHackingMultipliers();

	// multiplier for hacking yields, factors into how many theft threads are needed.
	playerHackingMoneyMult = mults.money;

	// growth multiplier, factors into how many growth threads are needed.
	playerHackingGrowMult = mults.growth;
}

function buildToolkit(ns) {
	var toolNames = [
		"/xeno/weak-target.js",
		"/xeno/grow-target.js",
		"/xeno/hack-target.js",
		"/xeno/host-manager.js",
		"/xeno/node-manager.js",
		"/xeno/tor-manager.js",
		"/xeno/program-manager.js",
		"/xeno/ram-manager.js",
		"/xeno/agency-manager.js",
		"/xeno/aug-manager.js",
	];
	for (var i = 0; i < toolNames.length; i++) {
		var tool = {
			ns: ns,
			name: toolNames[i],
			cost: ns.getScriptRam(toolNames[i], daemonHost),
			// I like short names.
			shortName: function () {
				switch (this.name) {
					case "/xeno/weak-target.js":
						return "weak";
					case "/xeno/grow-target.js":
						return "grow";
					case "/xeno/hack-target.js":
						return "hack";
					case "/xeno/host-manager.js":
						return "host";
					case "/xeno/node-manager.js":
						return "node";
					case "/xeno/tor-manager.js":
						return "tor";
					case "/xeno/program-manager.js":
						return "program";
					case "/xeno/ram-manager.js":
						return "ram";
					case "/xeno/agency-manager.js":
						return "agent";
					case "/xeno/aug-manager.js":
						return "aug";
				}
			},
			canRun: function (server) {
				return (
					doesServerHaveFile(this.ns, this.name, server.name) &&
					server.ramAvailable() >= this.cost
				);
			},
			isThreadSpreadingAllowed: function () {
				return this.shortName() === "weak";
			},
			getMaxThreads: function () {
				// analyzes the daemon servers array and figures about how many threads can be spooled up across all of them.
				var maxThreads = 0;
				sortServerList("ram");
				for (var i = 0; i < serverListRam.length; i++) {
					var daemonServer = serverListRam[i];
					// you don't count lol
					if (!daemonServer.hasRoot()) continue;
					var threadsHere = Math.floor(daemonServer.ramAvailable() / this.cost);
					if (!this.isThreadSpreadingAllowed()) return threadsHere;
					maxThreads += threadsHere;
				}
				return maxThreads;
			},
		};
		tools.push(tool);
	}
}

function doesServerHaveFile(ns, fileName, serverName) {
	return ns.fileExists(fileName, serverName);
}

// assemble a list of port crackers and abstract their functionality

function doRoot(server) {
	var portsCracked = 0;
	var portsNeeded = server.portsRequired;
	for (var i = 0; i < portCrackers.length; i++) {
		var cracker = portCrackers[i];
		if (cracker.exists()) {
			cracker.runAt(server.name);
			portsCracked++;
		}
		if (portsCracked >= portsNeeded) {
			cracker.doNuke(server.name);
			break;
		}
	}
}

function detectChangesInDaemonHosts(ns) {
	var purchasedServers = ns.getPurchasedServers();
	for (var p = 0; p < purchasedServers.length; p++) {
		var hostName = purchasedServers[p];
		if (addedServers.includes(hostName)) continue;

		const srv = new Server(ns, hostName);

		addedServers.push(hostName);
		serverListMoney.push(srv);
		serverListRam.push(srv);
	}
}

function sortServerList(o) {
	switch (o) {
		case "ram":
			serverListRam.sort(function (a, b) {
				return b.ramAvailable() - a.ramAvailable();
			});
			break;
		case "money":
			serverListMoney.sort(function (a, b) {
				return b.sortValue() - a.sortValue();
			});
			break;
	}
}

// return the adjustment quantity based on current performance metrics
// -1 adjusts down, 1 adjusts up, 0 means don't do anything.
function analyzeSnapshot(snapshot, currentTarget) {
	// always overshoot the target. this is the priority.
	if (
		snapshot.maxCompleteCycles() < snapshot.optimalPacedCycles &&
		currentTarget.percentageToSteal > 0.01
	) {
		return -0.01;
	} else if (
		snapshot.maxCompleteCycles() > snapshot.optimalPacedCycles &&
		currentTarget.percentageToSteal < 0.98
	) {
		// if we're already overshooting the target, check that an adjustment
		// doesn't *undershoot* it, because that's bad. we don't want that.
		currentTarget.percentageToSteal += 0.01;
		var comparisonSnapshot = getPerformanceSnapshot(currentTarget);
		currentTarget.percentageToSteal -= 0.01;
		if (
			comparisonSnapshot.maxCompleteCycles() <
			comparisonSnapshot.optimalPacedCycles
		) {
			return 0.0;
		} else {
			return 0.01;
		}
	}
	return 0.0;
}

// return a performance snapshot to compare against optimal, or another snapshot
function getPerformanceSnapshot(currentTarget) {
	var snapshot = {
		optimalBatchCost: getOptimalBatchCost(currentTarget),
		maxCompleteCycles: function () {
			// total number of cycles is the max you can fit inside any single daemon host, summed
			var maxCycles = 0;
			// we have to sort by available ram any time we're trying to execute.. because it changes.
			sortServerList("ram");
			for (var i = 0; i < serverListRam.length; i++) {
				var daemonServer = serverListRam[i];
				maxCycles += Math.floor(
					daemonServer.ramAvailable() / this.optimalBatchCost
				);
			}
			return maxCycles;
		},
		optimalPacedCycles: Math.min(
			maxBatches,
			Math.max(
				1,
				Math.floor(
					(currentTarget.timeToWeaken() * 1000 - queueDelay) /
						arbitraryExecutionDelay
				)
			)
		),
	};
	return snapshot;
}

async function optimizePerformanceMetrics(ns, currentTarget) {
	var isOptimal = false;
	var hasChanged = false;
	while (!isOptimal) {
		var snapshot = getPerformanceSnapshot(currentTarget);
		var adjustment = analyzeSnapshot(snapshot, currentTarget);
		if (adjustment === 0.0) {
			isOptimal = true;
		} else {
			hasChanged = true;
			currentTarget.percentageToSteal += adjustment;
		}
		await ns.sleep(10);
	}
	if (hasChanged) {
		ns.print(
			"Tuning optimum threading on " +
				currentTarget.name +
				", percentage: " +
				Math.floor(currentTarget.actualPercentageToSteal() * 10000) / 100
		);
	}
}

function getOptimalBatchCost(currentTarget) {
	var weakenTool = getTool("weak");
	var growTool = getTool("grow");
	var hackTool = getTool("hack");
	var weakenCost = currentTarget.weakenThreadTotalPerCycle() * weakenTool.cost;
	var growCost = currentTarget.growThreadsNeededAfterTheft() * growTool.cost;
	var hackCost = currentTarget.hackThreadsNeeded() * hackTool.cost;
	var totalCost = weakenCost + growCost + hackCost;
	return totalCost;
}

async function performScheduling(ns, currentTarget) {
	var firstEnding = null;
	var lastStart = null;
	var scheduledTasks = [];
	var canSchedule = scheduledTasks.length === 0;
	if (!canSchedule) return;
	var snapshot = getPerformanceSnapshot(currentTarget);
	var maxCycles = Math.min(
		snapshot.optimalPacedCycles,
		snapshot.maxCompleteCycles()
	);
	var cyclesScheduled = 0;
	var now = new Date(Date.now() + queueDelay);
	var lastBatch = 0;

	ns.print(
		"Scheduling " +
			currentTarget.name +
			", batches: " +
			maxCycles +
			" - anticipating an estimated " +
			Math.floor(currentTarget.timeToWeaken() * 2) +
			" second delay."
	);
	while (canSchedule) {
		var newBatchStart =
			scheduledTasks.length === 0
				? now
				: new Date(lastBatch.getTime() + arbitraryExecutionDelay);
		lastBatch = new Date(newBatchStart.getTime());
		var newBatch = getScheduleTiming(
			ns,
			newBatchStart,
			currentTarget,
			scheduledTasks.length
		);
		if (firstEnding === null) {
			firstEnding = new Date(newBatch.hackEnd.valueOf());
		}
		if (lastStart === null || lastStart < newBatch.firstFire) {
			lastStart = new Date(newBatch.firstFire.valueOf());
		}
		if (lastStart >= firstEnding) {
			canSchedule = false;
		}
		if (!canSchedule) break;
		scheduledTasks.push(newBatch);
		cyclesScheduled++;
		if (cyclesScheduled >= maxCycles) break;
		await ns.sleep(10);
	}
	for (var i = 0; i < scheduledTasks.length; i++) {
		var schedObj = scheduledTasks[i];
		for (var s = 0; s < schedObj.scheduleItems.length; s++) {
			var schedItem = schedObj.scheduleItems[s];
			if (!schedItem.itemRunning) {
				schedItem.itemRunning = true;
				var tool = getTool(schedItem.toolShortName);
				var threads = schedItem.threadsNeeded;
				var discriminationArg =
					schedObj.batchNumber.toString() + "-" + s.toString();
				var executionTime = 0;
				switch (schedItem.toolShortName) {
					case "hack":
						executionTime = currentTarget.timeToHack() * 1000;
						break;
					case "grow":
						executionTime = currentTarget.timeToGrow() * 1000;
						break;
					case "weak":
						executionTime = currentTarget.timeToWeaken() * 1000;
						break;
				}
				await arbitraryExecution(ns, tool, threads, [
					currentTarget.name,
					schedItem.start.getTime(),
					schedItem.end.getTime(),
					executionTime,
					discriminationArg,
				]);
			}
		}
	}
}

// returns an object that contains all 4 timed events start and end times as dates
function getScheduleTiming(ns, fromDate, currentTarget, batchNumber) {
	// spacing interval used to pace our script resolution
	var delayInterval = arbitraryExecutionDelay / 4;

	// first to fire
	var hackTime = currentTarget.timeToHack() * 1000;

	// second to fire
	var weakenTime = currentTarget.timeToWeaken() * 1000;

	// third to fire
	var growTime = currentTarget.timeToGrow() * 1000;

	// fourth to fire, we apply the interval here
	var weakenSecondTime =
		currentTarget.timeToWeaken() * 1000 + delayInterval * 3;

	// first, assume we're executing all these scripts pretty much instantly
	var time = new Date(fromDate.valueOf());

	// next, take the last possible execution time and work backwards, subtracting a small interval
	var finalWeakenResolvesAt = new Date(time.valueOf());
	finalWeakenResolvesAt.setTime(
		finalWeakenResolvesAt.getTime() + weakenSecondTime
	);

	// step 3 (grow back) should resolve "delay" before the final weaken.
	var growResolvesAt = new Date(finalWeakenResolvesAt.valueOf());
	growResolvesAt.setTime(growResolvesAt.getTime() - delayInterval);

	// step 2 (weaken after hack) should resolve "delay" before the grow.
	var weakenResolvesAt = new Date(growResolvesAt.valueOf());
	weakenResolvesAt.setTime(weakenResolvesAt.getTime() - delayInterval);

	// step 1 (steal a bunch of money) should resolve "delay" before its respective weaken.
	var hackResolvesAt = new Date(weakenResolvesAt.valueOf());
	hackResolvesAt.setTime(hackResolvesAt.getTime() - delayInterval);

	// from these optimal resolution times, determine when to execute each
	var fireHackAt = new Date(hackResolvesAt.valueOf());
	fireHackAt.setTime(fireHackAt.getTime() - hackTime);

	var fireFirstWeakenAt = new Date(weakenResolvesAt.valueOf());
	fireFirstWeakenAt.setTime(fireFirstWeakenAt.getTime() - weakenTime);

	var fireGrowAt = new Date(growResolvesAt.valueOf());
	fireGrowAt.setTime(fireGrowAt.getTime() - growTime);

	var fireSecondWeakenAt = new Date(finalWeakenResolvesAt.valueOf());
	fireSecondWeakenAt.setTime(fireSecondWeakenAt.getTime() - weakenTime);

	var firstThingThatFires = new Date(
		Math.min(
			fireSecondWeakenAt.getTime(),
			fireGrowAt.getTime(),
			fireFirstWeakenAt.getTime(),
			fireHackAt.getTime()
		)
	);
	var batchTiming = {
		batchStart: time,
		firstFire: firstThingThatFires,
		hackStart: fireHackAt,
		hackEnd: hackResolvesAt,
		firstWeakenStart: fireFirstWeakenAt,
		firstWeakenEnd: weakenResolvesAt,
		growStart: fireGrowAt,
		growEnd: growResolvesAt,
		secondWeakenStart: fireSecondWeakenAt,
		secondWeakenEnd: finalWeakenResolvesAt,
	};

	var schedObj = getScheduleObject(batchTiming, currentTarget, batchNumber);

	return schedObj;
}

function getTool(s) {
	debugger;

	let testing = tools.filter((t) => t.shortName() === s);

	for (var i = 0; i < tools.length; i++) {
		if (tools[i].shortName() == s) {
			return tools[i];
		}
	}
	return null;
}

// intended as a high-powered figure-this-out-for-me run command.
// if it can't run all the threads at once, it runs as many as it can
// across the spectrum of daemons available.
async function arbitraryExecution(ns, tool, threads, args) {
	debugger;
	sortServerList("ram");
	for (var i = 0; i < serverListRam.length; i++) {
		// we've done it, move on.
		if (threads <= 0) break;

		var sourceServer = serverListRam[i];
		// if we don't have root, we don't have exec privileges, move on.
		if (!sourceServer.hasRoot()) continue;

		ns.tprint(tool);
		var maxThreadsHere = Math.min(
			threads,
			Math.floor(sourceServer.ramAvailable() / tool.cost)
		);

		if (maxThreadsHere <= 0) continue;
		threads -= maxThreadsHere;
		// if we're coming from the daemon host, we can use run
		if (sourceServer.name == daemonHost) {
			var runArgs = [tool.name, maxThreadsHere].concat(args);
			await ns.run.apply(null, runArgs);
			return true;
		} else {
			// if not, we use a remote execute, with a script copy check.
			if (!doesServerHaveFile(ns, tool.name, sourceServer.name)) {
				await ns.scp(tool.name, daemonHost, sourceServer.name);
			}
			var execArgs = [tool.name, sourceServer.name, maxThreadsHere].concat(
				args
			);
			await ns.exec.apply(null, execArgs);
			return true;
		}
	}
	// the run failed!
	return false;
}

// brings the server down to minimum security to prepare for cycling scheduler activity
async function prepServer(ns, currentTarget) {
	// once we're in scheduling mode, presume prep server is to be skipped.
	if (currentTarget.isTargeting()) return;
	var now = new Date(Date.now().valueOf());
	if (
		currentTarget.security() > currentTarget.minSecurity ||
		currentTarget.money() < currentTarget.maxMoney
	) {
		var trueGrowThreadsNeeded = 0;
		var weakenTool = getTool("weak");
		var threadsNeeded = 0;
		var weakenForGrowthThreadsNeeded = 0;
		if (currentTarget.money() < currentTarget.maxMoney) {
			var growTool = getTool("grow");
			var growThreadsAllowable = growTool.getMaxThreads();
			var growThreadsNeeded = currentTarget.growThreadsNeeded();
			trueGrowThreadsNeeded = Math.min(growThreadsAllowable, growThreadsNeeded);
			weakenForGrowthThreadsNeeded = Math.ceil(
				(trueGrowThreadsNeeded * growthThreadHardening) / actualWeakenPotency()
			);
			var growThreadThreshold =
				(growThreadsAllowable - growThreadsNeeded) *
				(growTool.cost / weakenTool.cost);
			var growThreadsReleased =
				(weakenTool.cost / growTool.cost) *
				(weakenForGrowthThreadsNeeded + currentTarget.weakenThreadsNeeded());
			if (growThreadThreshold >= growThreadsReleased) {
				growThreadsReleased = 0;
			}
			trueGrowThreadsNeeded -= growThreadsReleased;
			if (trueGrowThreadsNeeded > 0) {
				await arbitraryExecution(ns, growTool, trueGrowThreadsNeeded, [
					currentTarget.name,
					now.getTime(),
					now.getTime(),
					0,
					"prep",
				]);
			}
		}
		threadsNeeded =
			currentTarget.weakenThreadsNeeded() + weakenForGrowthThreadsNeeded;
		var threadSleep = currentTarget.timeToWeaken() * 1000 + queueDelay;
		var threadsAllowable = weakenTool.getMaxThreads();
		var trueThreads = Math.min(threadsAllowable, threadsNeeded);
		if (trueThreads > 0) {
			ns.print(
				"Prepping " +
					currentTarget.name +
					", resting for " +
					Math.floor(threadSleep / 1000) +
					" seconds."
			);
			await arbitraryExecution(ns, weakenTool, trueThreads, [
				currentTarget.name,
				now.getTime(),
				now.getTime(),
				0,
				"prep",
			]);
		}
	}
}

// initialize a new incomplete schedule item
function getScheduleItem(toolShortName, start, end, threadsNeeded) {
	var schedItem = {
		toolShortName: toolShortName,
		start: start,
		end: end,
		threadsNeeded: threadsNeeded,
		itemRunning: false,
	};
	return schedItem;
}

function getScheduleObject(batchTiming, currentTarget, batchNumber) {
	var schedItems = [];

	var schedItem0 = getScheduleItem(
		"hack",
		batchTiming.hackStart,
		batchTiming.hackEnd,
		currentTarget.hackThreadsNeeded()
	);
	var schedItem1 = getScheduleItem(
		"weak",
		batchTiming.firstWeakenStart,
		batchTiming.firstWeakenEnd,
		currentTarget.weakenThreadsNeededAfterTheft()
	);
	var schedItem2 = getScheduleItem(
		"grow",
		batchTiming.growStart,
		batchTiming.growEnd,
		currentTarget.growThreadsNeededAfterTheft()
	);
	var schedItem3 = getScheduleItem(
		"weak",
		batchTiming.secondWeakenStart,
		batchTiming.secondWeakenEnd,
		currentTarget.weakenThreadsNeededAfterGrowth()
	);

	schedItems.push(schedItem0);
	schedItems.push(schedItem1);
	schedItems.push(schedItem2);
	schedItems.push(schedItem3);

	var scheduleObject = {
		batchNumber: batchNumber,
		batchStart: batchTiming.batchStart,
		firstFire: batchTiming.firstFire,
		hackEnd: batchTiming.hackEnd,
		batchFinish: schedItem3.end,
		scheduleItems: schedItems,
	};

	return scheduleObject;
}

function getPortCrackers(ns) {
	var count = 0;
	for (var i = 0; i < portCrackers.length; i++) {
		if (portCrackers[i].exists()) {
			count++;
		}
	}
	return count;
}
