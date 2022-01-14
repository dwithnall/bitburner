/** @param {NS} ns **/

export const milliseconds = (hrs, min, sec) => {
	return (hrs * 60 * 60 + min * 60 + sec) * 1000;
};
