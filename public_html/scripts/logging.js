const allowed_logs = {
    error:  true,
    warn:   true,
    status: true,
    notice: false
}

const logging_divider = "##################################################";
const logging_end = "--------------------------------------------------";

class Logger {
    static log(type, message) {
        if (!allowed_logs[type.key]) {
            return;
        }

        if (type.multiline) {
            this.log_multiline(type, message);
        } else {
            this.log_line(type, message);
        }
    }

    static log_line(type, message) {
        var msg = type.pretty + message;
        console.log(msg);
        console.log(logging_end);
    }

    static log_multiline(type, message) {
        if (type === LoggingType.ERROR) {
            console.log(logging_divider);
        }
        console.log(type.pretty);
        if (type === LoggingType.ERROR) {
            console.log(logging_divider);
        }
        for (var i = 0; i < message.length; i++) {
            console.log(message[i]);
        }
        if (type === LoggingType.ERROR) {
            console.log(logging_divider);
        }
        console.log(logging_end);
    }
}

const LoggingType = {
    ERROR: {
        key: "error",
        multiline: true,
        pretty: "Error: "
    },
    WARN: {
        key: "warn",
        multiline: true,
        pretty: "Warning: "
    },
    STATUS: {
        key: "status",
        multiline: false,
        pretty: "Status: "
    },
    NOTICE: {
        key: "notice",
        multiline: false,
        pretty: "Notice: "
    }
}