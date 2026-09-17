import "./quoteIngestWorker";
import { registerEscalationSchedule } from "./escalationWorker";

registerEscalationSchedule().then(() => console.log("Escalation sweep scheduled hourly."));
console.log("Workers running: quote-ingest, approval-escalation.");
