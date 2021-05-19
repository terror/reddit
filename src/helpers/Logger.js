const fs = require('fs');

/**
 * A simple logging mechanism that can write log messages to the console
 * as well as write log messages to log files.
 */
class Logger {
	constructor(logFileName) {
		// Default the log file's name to the current date if no name was provided.
		if (!logFileName) {
			const date = new Date();
			logFileName = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.log`;
		}

		// Use the Node file system (fs) module to open a stream to write to the log file.
		this.logger = fs.createWriteStream(`${__dirname}/../logs/${logFileName}`, { flags: 'a' });

		this.toggleConsoleLog(process.env.NODE_ENV !== 'production');
		this.toggleUncaughtExceptionLogging();
	}

	/**
	 * Generates a timestamp that will be used to prepend any message in a log file.
	 */
	static getTimeStamp() {
		const date = new Date();
		const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
		const formattedTime = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

		return `[${formattedDate} ${formattedTime}]`;
	}

	/**
	 * If we're in "production" mode, which is determined by the NODE_ENV
	 * environment variable, then uncaught exceptions should be logged instead
	 * of displaying them to the user. This is because we don't want the end
	 * user to see the entire stack trace.
	 *
	 * If we're in "development" mode, which is determined by the NODE_ENV
	 * environment variable, then uncaught exceptions should not be logged
	 * to a file. This is because as developers, we want to be able to see
	 * all the info in the console instead of having to open a log file.
	 */
	toggleUncaughtExceptionLogging() {
		if (process.env.NODE_ENV === 'production') {
			process.on('uncaughtException', (error) => {
				this.error(error);
			});
		}
	}

	/**
	 * Sets a flag that controls if log messages get printed to the console.
	 * @param {boolean} shouldLog
	 */
	toggleConsoleLog(shouldLog) {
		this.logToConsole = shouldLog;
	}

	/**
	 * Logs the entire stack trace of an error.
	 * @param {Object} error
	 */
	error(error) {
		this.log(error.stack);
	}

	/**
	 * Logs any informational message that isn't an error. For example,
	 * this could be used to log any time an HTTP request is received.
	 * @param {string} info
	 */
	info(info) {
		this.log(info);
	}

	/**
	 * Writes the message to the log file and, optionally, logs the
	 * message to the console.
	 * @param {string} message
	 */
	log(message) {
		const formattedMessage = `${Logger.getTimeStamp()} ${message}`;

		if (this.logToConsole) {
			console.log(formattedMessage);
		}

		this.logger.write(`${formattedMessage}\n`);
	}
}

// Export an instance of the Logger, not the class.
module.exports = new Logger();
