export const toolNames = ["weak-target.js", "grow-target.js", "hack-target.js"];

// --- CONSTANTS ---
// track how costly (in security) a growth/hacking thread is.
export const growthThreadHardening = 0.004;
export const hackThreadHardening = 0.002;

// initial potency of weaken threads before multipliers
export const weakenThreadPotency = 0.05;

// unadjusted server growth rate, this is way more than what you actually get
export const unadjustedGrowthRate = 1.03;

// max server growth rate, growth rates higher than this are throttled.
export const maxGrowthRate = 1.0035;

// the number of milliseconds to delay the grow execution after theft, for timing reasons
// the delay between each step should be *close* 1/4th of this number, but there is some imprecision
export const arbitraryExecutionDelay = 12000;

// the delay that it can take for a script to start, used to pessimistically schedule things in advance
export const queueDelay = 12000;

// the max number of batches this daemon will spool up to avoid running out of IRL ram
export const maxBatches = 60;

// the max number of targets this daemon will run workers against to avoid running out of IRL ram
export const maxTargets = 5;
