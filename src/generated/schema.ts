/** Generated from openapi.json. Do not edit; run npm run generate. */
type UnionKeys<T> = T extends unknown ? keyof T : never
type ExclusiveUnion<T, All = T> = T extends unknown ? T & Partial<Record<Exclude<UnionKeys<All>, keyof T>, never>> : never
/** Every error code the contract documents. New codes may appear: handle an unknown one by its status. */
export type TotemErrorCode = "invalid_request" | "team_required" | "secret_key_in_browser" | "invalid_credentials" | "key_expired" | "insufficient_scope" | "plan_not_entitled" | "ip_not_allowed" | "team_state_restricted" | "sector_restricted" | "capability_disabled" | "resource_missing" | "team_not_accessible" | "resync_required" | "capture_not_ready" | "sync_cursor_expired" | "rate_limited" | "quota_exceeded" | "internal_error" | "api_disabled" | "service_unavailable"
/** What the caller should do about an error, from the contract's error catalogue. */
export type ErrorAction = "fix_request" | "check_credentials" | "contact_support" | "keep_and_retry" | "drop_team" | "resync" | "wait_capture" | "retry_after" | "backoff"
export interface Schemas {
/** One stage, status or assignee transition of a lead. Activities never change once written. */
"Activity": ExclusiveUnion<({
/** Public id of the record. */
"id": string;
/** Always `activity`. */
"object": "activity";
/** `true` for real data; `false` in example data. */
"livemode": boolean;
/** `status_changed`, `archived`, `unarchived`, or `revived` (the contact came back on their own and reopened an archived lead). */
"type": ("status_changed" | "archived" | "unarchived" | "revived");
/** The team the lead belongs to. */
"team": string;
/** The lead that moved. Null only while Totem has not yet assigned the lead its id. */
"lead": (string | null);
/** When the change was saved. */
"occurred_at": string;
/** Who made the change: a person, the AI, Totem automation, an API caller, or unknown. Totem knows who made a change only when the same save wrote the lead's status, so a stage or assignee change made on its own reads unknown. */
"actor_kind": (("human" | "ai" | "system" | "api" | "unknown") | (string & {}));
/** The stage the lead was in after the change (for "clear pipeline data", the stage it left), or null. */
"stage_snapshot": ({
/** The stage. */
"stage": (string | null);
/** Its board, or null for a legacy stage without one. */
"board": (string | null);
/** The stage name when the change was recorded, or null when the stage was already deleted. */
"name": (string | null)
} | null);
/** The estimated value at that moment, in major units, or null. */
"value_snapshot": (number | null);
/** The status before, or null when there was none. */
"from": ((("new" | "contacted" | "qualified" | "negotiating" | "converted" | "lost" | "archived" | "unreachable") | (string & {})) | null);
/** The status after. */
"to": (("new" | "contacted" | "qualified" | "negotiating" | "converted" | "lost" | "archived" | "unreachable") | (string & {}));
/** Increases every time one of the record's exported fields changes. Apply a change only when its version is greater than the one you hold. */
"version": number;
/** When Totem recorded this version (UTC). It is not the time the business event happened. */
"updated_at": string
} | {
/** Public id of the record. */
"id": string;
/** Always `activity`. */
"object": "activity";
/** `true` for real data; `false` in example data. */
"livemode": boolean;
/** Always `stage_changed`. */
"type": "stage_changed";
/** The team the lead belongs to. */
"team": string;
/** The lead that moved. Null only while Totem has not yet assigned the lead its id. */
"lead": (string | null);
/** When the change was saved. */
"occurred_at": string;
/** Who made the change: a person, the AI, Totem automation, an API caller, or unknown. Totem knows who made a change only when the same save wrote the lead's status, so a stage or assignee change made on its own reads unknown. */
"actor_kind": (("human" | "ai" | "system" | "api" | "unknown") | (string & {}));
/** The stage the lead was in after the change (for "clear pipeline data", the stage it left), or null. */
"stage_snapshot": ({
/** The stage. */
"stage": (string | null);
/** Its board, or null for a legacy stage without one. */
"board": (string | null);
/** The stage name when the change was recorded, or null when the stage was already deleted. */
"name": (string | null)
} | null);
/** The estimated value at that moment, in major units, or null. */
"value_snapshot": (number | null);
/** The stage and board before, or null when the lead had neither. */
"from": ({
/** The stage. */
"stage": (string | null);
/** The board, or null for a legacy stage without one. */
"board": (string | null)
} | null);
/** The stage and board after. */
"to": {
/** The stage. */
"stage": (string | null);
/** The board, or null for a legacy stage without one. */
"board": (string | null)
};
/** Increases every time one of the record's exported fields changes. Apply a change only when its version is greater than the one you hold. */
"version": number;
/** When Totem recorded this version (UTC). It is not the time the business event happened. */
"updated_at": string
} | {
/** Public id of the record. */
"id": string;
/** Always `activity`. */
"object": "activity";
/** `true` for real data; `false` in example data. */
"livemode": boolean;
/** Always `assignees_changed`. */
"type": "assignees_changed";
/** The team the lead belongs to. */
"team": string;
/** The lead that moved. Null only while Totem has not yet assigned the lead its id. */
"lead": (string | null);
/** When the change was saved. */
"occurred_at": string;
/** Who made the change: a person, the AI, Totem automation, an API caller, or unknown. Totem knows who made a change only when the same save wrote the lead's status, so a stage or assignee change made on its own reads unknown. */
"actor_kind": (("human" | "ai" | "system" | "api" | "unknown") | (string & {}));
/** The stage the lead was in after the change (for "clear pipeline data", the stage it left), or null. */
"stage_snapshot": ({
/** The stage. */
"stage": (string | null);
/** Its board, or null for a legacy stage without one. */
"board": (string | null);
/** The stage name when the change was recorded, or null when the stage was already deleted. */
"name": (string | null)
} | null);
/** The estimated value at that moment, in major units, or null. */
"value_snapshot": (number | null);
/** The assigned members before, sorted. */
"from": Array<string>;
/** The assigned members after, sorted. */
"to": Array<string>;
/** Increases every time one of the record's exported fields changes. Apply a change only when its version is greater than the one you hold. */
"version": number;
/** When Totem recorded this version (UTC). It is not the time the business event happened. */
"updated_at": string
})>;
/** A page of Activity objects, in a stable order that carries no meaning. */
"ActivityList": {
/** Always `list`. */
"object": "list";
/** The items of this page. */
"data": Array<Schemas["Activity"]>;
/** `true` when another page follows: fetch it with `next_cursor`, even if this page holds fewer items than `limit`. */
"has_more": boolean;
/** Opaque cursor for the next page, or null on the last page. Never parse it. */
"next_cursor": (string | null)
};
/** A board with its stages in pipeline order. */
"Board": {
/** Public id of the record. */
"id": string;
/** Always `board`. */
"object": "board";
/** `true` for real data; `false` in example data. */
"livemode": boolean;
/** The team this record belongs to. */
"team": string;
/** The board's name, or null when none is stored. */
"name": (string | null);
/** True for the team's default board, where new leads land unless routed elsewhere. */
"is_default": boolean;
/** True when the board is archived (hidden from the board selector). Its leads still export. */
"is_archived": boolean;
/** The stage of this board a lead moves to when its first appointment is confirmed, or null when none is set or it names no stage of this board. */
"appointment_booked_stage": (string | null);
/** The board's stages, ordered by position, then by id. A stage with no position stored at all is left out, although a lead can still name it. */
"stages": Array<{
/** Always `stage`. */
"object": "stage";
/** Public id of the stage; a lead's `stage` names it. */
"id": string;
/** The stage's name, or null when none is stored. */
"name": (string | null);
/** The stage's position on its board, left to right; null when the stored position is not a number. Stages are listed in this order. */
"position": (number | null);
/** True for the stage new leads of this board enter. */
"is_default": boolean;
/** True for a final stage: moving a lead here marks it converted. */
"is_final": boolean;
/** True for an archive stage, whose leads are hidden from the main board view. */
"is_archive": boolean;
/** Who moves leads: `standard` (people only), `supervised` (AI may move leads in, people move them out) or `automated` (AI runs outreach and moves leads in and out); null for a value this version does not know. */
"mode": ((("standard" | "supervised" | "automated") | (string & {})) | null)
}>;
/** Increases every time one of the record's exported fields changes. Apply a change only when its version is greater than the one you hold. */
"version": number;
/** When Totem recorded this version (UTC). It is not the time the business event happened. */
"updated_at": string
};
/** A page of Board objects, in a stable order that carries no meaning. */
"BoardList": {
/** Always `list`. */
"object": "list";
/** The items of this page. */
"data": Array<Schemas["Board"]>;
/** `true` when another page follows: fetch it with `next_cursor`, even if this page holds fewer items than `limit`. */
"has_more": boolean;
/** Opaque cursor for the next page, or null on the last page. Never parse it. */
"next_cursor": (string | null)
};
/** A booking and its `kind`: an appointment for a bookable service, an event from the connected calendar, or a booking imported from another system. */
"Booking": {
/** Public id of the record. */
"id": string;
/** Always `booking`. */
"object": "booking";
/** `true` for real data; `false` in example data. */
"livemode": boolean;
/** The team this record belongs to. */
"team": string;
/** The lead this booking belongs to, or null for a booking without a lead or when the lead no longer exists. Names and contact details appear only on the lead. */
"lead": (string | null);
/** `service_booking` (booked for a bookable service, by the AI, a customer or a person), `calendar_event` (an event from the connected calendar) or `external_import` (synced from an external booking system or read from a portal email). A booking from an origin this version does not know is reported as `calendar_event`. */
"kind": (("service_booking" | "calendar_event" | "external_import") | (string & {}));
/** The booked service (see `/booking_services`) on a `service_booking`; null otherwise. */
"service": (string | null);
/** `scheduled`, `rescheduled`, `cancelled`, `postponed`, `attended`, `no_show` or `team_no_show` (attendance is recorded only by people); null for a value this version does not know. `rescheduled` means the booking was moved in place and its times are the new ones; a booking the AI replaced with a new one reads `cancelled`, with `rescheduled_to` set. */
"status": ((("scheduled" | "rescheduled" | "cancelled" | "postponed" | "attended" | "no_show" | "team_no_show") | (string & {})) | null);
/** When the booking starts (UTC). */
"starts_at": (string | null);
/** When the booking ends (UTC). */
"ends_at": (string | null);
/** `online`, `in_person` or `phone`; null when not stored. */
"meeting_type": ((("online" | "in_person" | "phone") | (string & {})) | null);
/** Who booked it: `ai`, `customer` or `operator`; null when not recorded. */
"source": ((("ai" | "customer" | "operator") | (string & {})) | null);
/** The booking this one replaced in a reschedule, or null. For a few seconds the replaced booking can still read `scheduled`; bookings rescheduled before Totem started recording this link may not have it. */
"rescheduled_from": (string | null);
/** The booking that replaced this one in a reschedule, or null. When it is set, this booking reads `cancelled`. */
"rescheduled_to": (string | null);
/** When the booking was recorded in Totem (UTC). */
"created_at": (string | null);
/** Increases every time one of the record's exported fields changes. Apply a change only when its version is greater than the one you hold. */
"version": number;
/** When Totem recorded this version (UTC). It is not the time the business event happened. */
"updated_at": string
};
/** A page of Booking objects, in a stable order that carries no meaning. */
"BookingList": {
/** Always `list`. */
"object": "list";
/** The items of this page. */
"data": Array<Schemas["Booking"]>;
/** `true` when another page follows: fetch it with `next_cursor`, even if this page holds fewer items than `limit`. */
"has_more": boolean;
/** Opaque cursor for the next page, or null on the last page. Never parse it. */
"next_cursor": (string | null)
};
/** A service customers can book, with its meeting type. */
"BookingService": {
/** Public id of the record. */
"id": string;
/** Always `booking_service`. */
"object": "booking_service";
/** `true` for real data; `false` in example data. */
"livemode": boolean;
/** The team this record belongs to. */
"team": string;
/** The service's name, or null when none is stored. */
"name": (string | null);
/** How the service happens: `online` (the default when none is stored), `in_person` or `phone`. */
"meeting_type": (("online" | "in_person" | "phone") | (string & {}))
};
/** Every BookingService object, in one response: this list is never paged. */
"BookingServiceList": {
/** Always `list`. */
"object": "list";
/** The items of this page. */
"data": Array<Schemas["BookingService"]>;
/** `true` when another page follows: fetch it with `next_cursor`, even if this page holds fewer items than `limit`. */
"has_more": boolean;
/** Opaque cursor for the next page, or null on the last page. Never parse it. */
"next_cursor": (string | null)
};
/** A call: its direction, timing and a normalized outcome. No recording or transcript. */
"Call": {
/** Public id of the record. */
"id": string;
/** Always `call`. */
"object": "call";
/** `true` for real data; `false` in example data. */
"livemode": boolean;
/** The team this record belongs to. */
"team": string;
/** The lead this call is linked to, or null when it is unlinked or the lead no longer exists. Identity (name, phone) travels on the lead only. */
"lead": (string | null);
/** `inbound` or `outbound`; null when not stored. */
"direction": ((("inbound" | "outbound") | (string & {})) | null);
/** When the call started (UTC), or when it was recorded if the provider gave no start time. */
"started_at": (string | null);
/** Whole seconds of the call (rounded down); null while the call is still live, or when not stored. */
"duration_seconds": (number | null);
/** How the call ended: `answered_human`, `answered_ai`, `voicemail`, `no_answer`, `busy`, `failed`, or `unknown` (still live, or no evidence of who answered). Read it with `outcome_basis`. */
"outcome": (("answered_human" | "answered_ai" | "voicemail" | "no_answer" | "busy" | "failed" | "unknown") | (string & {}));
/** The evidence behind `outcome`: `inbound_verdict` (Totem's classification of an inbound call on its phone lines), `ai_analysis` (Totem's classification of the status, end reason and length that Retell reports), `duration_floor` (a call on a connected Zadarma PBX, where at least 10 seconds counts as answered), `carrier_answer_only` (only the carrier's answer signal, which never counts as answered, so a connected call reads `unknown`: every outbound call on Totem's phone lines, made by the AI or by a person, and an inbound one Totem has not classified), `browser_session` (a web voice session with the assistant), or `none` (no evidence, as for a call that is still live). */
"outcome_basis": (("inbound_verdict" | "ai_analysis" | "duration_floor" | "carrier_answer_only" | "browser_session" | "none") | (string & {}));
/** Increases every time one of the record's exported fields changes. Apply a change only when its version is greater than the one you hold. */
"version": number;
/** When Totem recorded this version (UTC). It is not the time the business event happened. */
"updated_at": string
};
/** A page of Call objects, in a stable order that carries no meaning. */
"CallList": {
/** Always `list`. */
"object": "list";
/** The items of this page. */
"data": Array<Schemas["Call"]>;
/** `true` when another page follows: fetch it with `next_cursor`, even if this page holds fewer items than `limit`. */
"has_more": boolean;
/** Opaque cursor for the next page, or null on the last page. Never parse it. */
"next_cursor": (string | null)
};
/** A conversation on one channel: its status, assignee and the times of the latest messages, never their content. */
"Conversation": {
/** Public id of the record. */
"id": string;
/** Always `conversation`. */
"object": "conversation";
/** `true` for real data; `false` in example data. */
"livemode": boolean;
/** The team this record belongs to. */
"team": string;
/** The lead this conversation is linked to, or null when it is unlinked or the lead no longer exists. Identity (name, phone, handle) travels on the lead only. */
"lead": (string | null);
/** The channel: `whatsapp`, `email`, `chatbot` (the web chat), `facebook`, `instagram`, `sms` or `tiktok`; null for a value this version does not know. A lead can have several conversations on the same channel and business account, one for each contact address (phone number, email address or handle) it has used, so key your copy on `id`. */
"channel_type": ((("sms" | "whatsapp" | "facebook" | "instagram" | "tiktok" | "chatbot" | "email") | (string & {})) | null);
/** `active` or `archived` in the team's inbox; null for a value this version does not know. */
"status": ((("active" | "archived") | (string & {})) | null);
/** The team member assigned to the conversation (see `/members`), or null. */
"assignee": (string | null);
/** `human` while a person has taken the conversation over, including a WhatsApp chat answered from the WhatsApp Business app; `ai` otherwise. `ai` means no takeover is active, not that an assistant is set up or answering on this channel. A timed takeover returns to `ai` when it expires, and the record's version changes then. */
"reply_mode": (("ai" | "human") | (string & {}));
/** When the conversation was created (UTC). */
"created_at": (string | null);
/** The latest customer message (UTC). Not counted: erased messages, imported WhatsApp history and web-chat visitor turns, so a `chatbot` conversation reads null. Instagram shares cannot be told apart and count. */
"last_inbound_at": (string | null);
/** The latest message sent to the customer that did not fail (UTC), whoever sent it. Imported WhatsApp history counts. */
"last_outbound_at": (string | null);
/** Increases every time one of the record's exported fields changes. Apply a change only when its version is greater than the one you hold. */
"version": number;
/** When Totem recorded this version (UTC). It is not the time the business event happened. */
"updated_at": string
};
/** A page of Conversation objects, in a stable order that carries no meaning. */
"ConversationList": {
/** Always `list`. */
"object": "list";
/** The items of this page. */
"data": Array<Schemas["Conversation"]>;
/** `true` when another page follows: fetch it with `next_cursor`, even if this page holds fewer items than `limit`. */
"has_more": boolean;
/** Opaque cursor for the next page, or null on the last page. Never parse it. */
"next_cursor": (string | null)
};
/** One change: the record's current state, or its removal. */
"FeedItem": ExclusiveUnion<({
/** The kind of the record, such as `lead` or `call`. */
"kind": "lead";
/** Public id of the record; the facets `lead_attribution` and `lead_response` use their lead's id. */
"id": string;
/** The record's version. Apply the item only when it is greater than the version you hold. */
"version": number;
/** The record as it is now. */
"object": Schemas["Lead"]
} | {
/** The kind of the record, such as `lead` or `call`. */
"kind": "lead_attribution";
/** Public id of the record; the facets `lead_attribution` and `lead_response` use their lead's id. */
"id": string;
/** The record's version. Apply the item only when it is greater than the version you hold. */
"version": number;
/** The record as it is now. */
"object": Schemas["LeadAttribution"]
} | {
/** The kind of the record, such as `lead` or `call`. */
"kind": "lead_response";
/** Public id of the record; the facets `lead_attribution` and `lead_response` use their lead's id. */
"id": string;
/** The record's version. Apply the item only when it is greater than the version you hold. */
"version": number;
/** The record as it is now. */
"object": Schemas["LeadResponse"]
} | {
/** The kind of the record, such as `lead` or `call`. */
"kind": "activity";
/** Public id of the record; the facets `lead_attribution` and `lead_response` use their lead's id. */
"id": string;
/** The record's version. Apply the item only when it is greater than the version you hold. */
"version": number;
/** The record as it is now. */
"object": Schemas["Activity"]
} | {
/** The kind of the record, such as `lead` or `call`. */
"kind": "call";
/** Public id of the record; the facets `lead_attribution` and `lead_response` use their lead's id. */
"id": string;
/** The record's version. Apply the item only when it is greater than the version you hold. */
"version": number;
/** The record as it is now. */
"object": Schemas["Call"]
} | {
/** The kind of the record, such as `lead` or `call`. */
"kind": "conversation";
/** Public id of the record; the facets `lead_attribution` and `lead_response` use their lead's id. */
"id": string;
/** The record's version. Apply the item only when it is greater than the version you hold. */
"version": number;
/** The record as it is now. */
"object": Schemas["Conversation"]
} | {
/** The kind of the record, such as `lead` or `call`. */
"kind": "booking";
/** Public id of the record; the facets `lead_attribution` and `lead_response` use their lead's id. */
"id": string;
/** The record's version. Apply the item only when it is greater than the version you hold. */
"version": number;
/** The record as it is now. */
"object": Schemas["Booking"]
} | {
/** The kind of the record, such as `lead` or `call`. */
"kind": "board";
/** Public id of the record; the facets `lead_attribution` and `lead_response` use their lead's id. */
"id": string;
/** The record's version. Apply the item only when it is greater than the version you hold. */
"version": number;
/** The record as it is now. */
"object": Schemas["Board"]
} | {
/** The kind of the record, such as `lead` or `call`. */
"kind": ("lead" | "lead_attribution" | "lead_response" | "activity" | "call" | "conversation" | "booking" | "board");
/** Public id of the removed record. */
"id": string;
/** The record's version. Apply the item only when it is greater than the version you hold. */
"version": number;
/** Present only on a removal. */
"removed": {
/** `erased` after an erasure, which is also what deleting a lead, call or conversation in Totem does: erasing a lead erases its calls, conversations and merged duplicates too, while its bookings stay with `lead` set to `null`. `deleted` for any other removal. Either way, delete your copy and keep this version, so an older copy delivered later is ignored. */
"reason": (("erased" | "deleted") | (string & {}))
}
})>;
/** A page of the changes feed. */
"FeedPage": {
/** Always `list`. */
"object": "list";
/** Changes in the order Totem recorded them. A record can appear more than once during an initial sync. */
"data": Array<Schemas["FeedItem"]>;
/** `true` when more changes are ready now; `false` once you have caught up. */
"has_more": boolean;
/** Always present, even on an empty page. Store it after applying the page and send it on the next call. */
"next_cursor": string
};
/** The API is up. */
"Health": {
/** Always `health`. */
"object": "health";
/** Always `ok`: when the API is not available, the answer is an error instead. */
"status": "ok"
};
/** A lead or client record: lead fields only. */
"Lead": {
/** Public id of the record. */
"id": string;
/** Always `lead`. */
"object": "lead";
/** `true` for real data; `false` in example data. */
"livemode": boolean;
/** The team the record belongs to. */
"team": string;
/** `lead` when the record has a pipeline status, otherwise `client`. A lead whose status this version does not know reads `status: null`. */
"record_kind": (("lead" | "client") | (string & {}));
/** First name or display name, or null. */
"name": (string | null);
/** Surname, or null. */
"surname": (string | null);
/** Email address as stored, or null. */
"email": (string | null);
/** Company, or null. */
"company": (string | null);
/** Phone in E.164, only when the stored number validates; otherwise null. */
"phone": (string | null);
/** `valid` (see `phone`), `invalid` (a number is stored but does not validate, for example one stored without its country prefix) or `missing`. */
"phone_status": (("valid" | "invalid" | "missing") | (string & {}));
/** Pipeline status; null for a client record, or for a status this version does not know. `converted` is not "won". */
"status": ((("new" | "contacted" | "qualified" | "negotiating" | "converted" | "lost" | "archived" | "unreachable") | (string & {})) | null);
/** Who set the current status: a person, the AI, Totem automation, an API caller, or unknown (no recorded transition lands on it). Null when `status` is null. */
"status_set_by": ((("human" | "ai" | "system" | "api" | "unknown") | (string & {})) | null);
/** Why the record was archived, as a closed code; stored free text is `other`. Null when none is stored. */
"archive_reason": ((("opt_out" | "no_consent" | "not_interested" | "not_qualified" | "no_contact" | "merged" | "family_transfer" | "other") | (string & {})) | null);
/** The status the lead had before its current archive; null while it is not archived or when unknown. */
"archived_from_status": ((("new" | "contacted" | "qualified" | "negotiating" | "converted" | "lost" | "archived" | "unreachable") | (string & {})) | null);
/** Contact permissions. Apply them before any outreach from your own systems. */
"contact_permissions": {
/** True when the person asked never to be contacted (the `opt_out` archive reason). Stop every channel. */
"do_not_contact": boolean;
/** True when the person unsubscribed from marketing and follow-up email. */
"email_opt_out": boolean;
/** When the email opt-out was recorded, or null. */
"email_opt_out_at": (string | null);
/** WhatsApp consent: false when refused, true when recorded, null when unknown. */
"whatsapp_consent": (boolean | null);
/** The source of each permission. */
"provenance": {
/** Where `do_not_contact` comes from, or null when it is false. */
"do_not_contact": ((("archive_reason") | (string & {})) | null);
/** Who recorded the email opt-out: the unsubscribe link, a person in Totem, or unknown. Null when there is none. */
"email_opt_out": ((("unsubscribe_link" | "manual" | "unknown") | (string & {})) | null);
/** `archive_reason` when a refusal is recorded as the archive reason; `stored` for the value kept on the record, which team members can edit. Null when unknown. */
"whatsapp_consent": ((("stored" | "archive_reason") | (string & {})) | null)
}
};
/** The lead this record was merged into, or null (also when that lead no longer exists). */
"merged_into": (string | null);
/** Where a transfer to another team of your organization sent this lead, or null. The team may be one your key does not read. */
"transferred_to": ({
/** The destination team. */
"team": string;
/** The destination lead, or null when its id cannot be named across teams: an assistant handoff created it, or the transfer landed on an existing lead-ads lead (Meta, Google Ads or LinkedIn) or another lead with a fixed id. */
"lead": (string | null)
} | null);
/** When the contact last came back on their own and revived an archived lead, or null. */
"revived_at": (string | null);
/** True when the lead was converted with "clear pipeline data": board, stage, priority, assignees, estimated value and the source fields other than `source_channel` are null because they were cleared. */
"pipeline_cleared": boolean;
/** When the lead was converted, while its status is `converted`; otherwise null. */
"converted_at": (string | null);
/** The estimated value when it was converted, in major units. Survives "clear pipeline data". */
"value_at_conversion": (number | null);
/** Priority, or null. */
"priority": ((("low" | "medium" | "high" | "urgent") | (string & {})) | null);
/** Labels as stored. `lead` and `booking` are system labels. */
"tags": Array<string>;
/** The board, resolved through the stage when it has one; or null. */
"board": (string | null);
/** The stage, or null. */
"stage": (string | null);
/** Assigned members, sorted. Null when the record has no pipeline data. */
"assignees": (Array<string> | null);
/** Estimated value in major units as stored (decimals allowed), or null. */
"estimated_value": (number | null);
/** Always null: Totem stores no currency with the value. */
"estimated_value_currency": null;
/** The stored lead source; `api` also covers leads created by Totem itself (for example from a conversation or a call), see `source_detail`. Null when none is stored. */
"source": ((("meta_lead_ads" | "manual" | "website_form" | "booking_page" | "csv_import" | "api" | "chatbot" | "google_ads" | "linkedin" | "other") | (string & {})) | null);
/** The channel the record started on (for example `whatsapp`, `phone`, `widget`), or null. Team members can edit it. */
"source_channel": (string | null);
/** `conversation`, `call`, `external:<provider>`, `gated_ad:<source>`, `family_handoff`, `api_intake` or `unknown`; null when `source` needs no detail. */
"source_detail": (string | null);
/** `server_written` when Totem set the source from what the ad platform reported; otherwise `member_editable` (team members can change it). Null with `source`. */
"source_provenance": ((("server_written" | "member_editable") | (string & {})) | null);
/** When the record was created. */
"created_at": string;
/** Increases every time one of the record's exported fields changes. Apply a change only when its version is greater than the one you hold. */
"version": number;
/** When Totem recorded this version (UTC). It is not the time the business event happened. */
"updated_at": string
};
/** Where a lead came from: its original capture and latest submission. */
"LeadAttribution": {
/** Public id of the record. */
"id": string;
/** Always `lead_attribution`. */
"object": "lead_attribution";
/** `true` for real data; `false` in example data. */
"livemode": boolean;
/** The team the lead belongs to. */
"team": string;
/** How the lead first entered the CRM, frozen once; null when it was not captured. "Original" is the first time the contact entered the CRM, not the first ad it answered. */
"original_capture": ({
/** `at_creation`: frozen from the lead as it was first saved. `at_activation`: copied once from the lead as it was when the API was activated, for a lead with no capture record (created before Totem started recording attribution, or whose creation was not recorded). */
"capture": (("at_creation" | "at_activation") | (string & {}));
/** When the record was written. */
"captured_at": string;
/** The lead source at capture, from the same set as the lead's `source`; `api` also covers leads created by Totem itself (for example from a conversation or a call, see `origin`). Null when none was stored. */
"source": ((("meta_lead_ads" | "manual" | "website_form" | "booking_page" | "csv_import" | "api" | "chatbot" | "google_ads" | "linkedin" | "other") | (string & {})) | null);
/** The real source of a gated ad lead stored as `api`, or null. */
"source_hint": (string | null);
/** The channel at capture, or null. */
"source_channel": (string | null);
/** The portal or booking platform of a forwarded or synced lead, or null. */
"external_provider": (string | null);
/** When the lead was received, as first written, or null. */
"received_at": (string | null);
/** When the ad platform says the form was submitted, or null. */
"submitted_at": (string | null);
/** The conversation or call that created the lead (never its id), or null (also for an origin of another kind). */
"origin": ({
/** `conversation` or `call`. */
"kind": (("conversation" | "call") | (string & {}));
/** Its channel, or null. */
"channel": (string | null)
} | null);
/** The campaign. */
"campaign": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
};
/** Its name. */
"name": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
}
};
/** The ad. */
"ad": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
};
/** Its name. */
"name": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
}
};
/** The Meta ad set. */
"ad_set": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
};
/** Its name. */
"name": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
}
};
/** The Google Ads ad group. */
"ad_group": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
}
};
/** The lead form. */
"form": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
};
/** Its name. */
"name": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
}
};
/** The creative. */
"creative": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
}
};
/** The Google Ads asset group. */
"asset_group": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
}
};
/** The Facebook page. */
"page": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
};
/** Its name. */
"name": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
}
};
/** The five standard UTM keys, or null when none was captured. */
"utm": ({
/** `utm_source`. */
"source": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
};
/** `utm_medium`. */
"medium": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
};
/** `utm_campaign`. */
"campaign": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
};
/** `utm_term`. */
"term": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
};
/** `utm_content`. */
"content": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
}
} | null);
/** The network of the first click id (`google` or `meta`). The click id itself is never kept. */
"click_network": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
};
/** The first Meta ad referral of the conversation that created the lead, or null. */
"ad_referral": ({
/** The channel. */
"channel": (("whatsapp" | "facebook" | "instagram") | (string & {}));
/** What opened the conversation. */
"source_type": (("ad" | "post" | "link" | "other") | (string & {}));
/** The ad or post id, or null. */
"ad_id": (string | null);
/** Meta's time for the referral. */
"referred_at": string;
/** Always `provider`: only the signed Meta webhooks write it. */
"provenance": "provider"
} | null);
/** The transfer from another team of your organization that created the lead, or null. */
"family_origin": ({
/** The team of your organization the lead came from. */
"team": string;
/** Its lead there, or null when that id cannot be named across teams: an assistant handed off a caller without one, or the lead there is a lead-ads lead (Meta, Google Ads or LinkedIn) or another lead with a fixed id. `automated` tells an assistant's handoff from a move made by a person. */
"lead": (string | null);
/** True for an assistant's handoff. */
"automated": boolean
} | null);
/** Not available in this version. */
"audience": {
/** Always null. */
"value": null;
/** Totem does not record audiences; an ad set is not one. */
"missing_reason": "unsupported"
}
} | null);
/** `not_captured` when `original_capture` is null, otherwise null. */
"original_capture_missing_reason": ((("not_captured") | (string & {})) | null);
/** The newest ad submission recorded for this lead, including a repeat on an existing contact; null when none is recorded. A submission the ad platform reports deleted (a LinkedIn member deleting their form response) is no longer shown, and once the newest one expires or is withdrawn an older one can show instead. */
"latest_submission": ({
/** The ad platform. */
"provider": (("meta" | "google_ads" | "linkedin") | (string & {}));
/** When the platform says it was submitted, or null. */
"submitted_at": (string | null);
/** The campaign. */
"campaign": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
};
/** Its name. */
"name": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
}
};
/** The ad. */
"ad": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
};
/** Its name. */
"name": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
}
};
/** The Meta ad set. */
"ad_set": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
};
/** Its name. */
"name": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
}
};
/** The Google Ads ad group. */
"ad_group": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
}
};
/** The lead form. */
"form": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
};
/** Its name. */
"name": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
}
};
/** The creative. */
"creative": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
}
};
/** The Google Ads asset group. */
"asset_group": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
}
};
/** Its UTM keys, or null. */
"utm": ({
/** `utm_source`. */
"source": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
};
/** `utm_medium`. */
"medium": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
};
/** `utm_campaign`. */
"campaign": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
};
/** `utm_term`. */
"term": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
};
/** `utm_content`. */
"content": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": (("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured") | (string & {}))
}
} | null);
/** When this submission stops being readable (Google Ads and LinkedIn keep it 90 days); null for Meta. */
"expires_at": (string | null)
} | null);
/** `not_captured` when `latest_submission` is null, otherwise null. */
"latest_submission_missing_reason": ((("not_captured") | (string & {})) | null);
/** Increases every time one of the record's exported fields changes. Apply a change only when its version is greater than the one you hold. */
"version": number;
/** When Totem recorded this version (UTC). It is not the time the business event happened. */
"updated_at": string
};
/** A lead with its `attribution` and `response` facets, each with its own `version`. A facet is `null` only while Totem is still preparing it. */
"LeadDetail": {
/** Public id of the record. */
"id": string;
/** Always `lead`. */
"object": "lead";
/** `true` for real data; `false` in example data. */
"livemode": boolean;
/** The team the record belongs to. */
"team": string;
/** `lead` when the record has a pipeline status, otherwise `client`. A lead whose status this version does not know reads `status: null`. */
"record_kind": (("lead" | "client") | (string & {}));
/** First name or display name, or null. */
"name": (string | null);
/** Surname, or null. */
"surname": (string | null);
/** Email address as stored, or null. */
"email": (string | null);
/** Company, or null. */
"company": (string | null);
/** Phone in E.164, only when the stored number validates; otherwise null. */
"phone": (string | null);
/** `valid` (see `phone`), `invalid` (a number is stored but does not validate, for example one stored without its country prefix) or `missing`. */
"phone_status": (("valid" | "invalid" | "missing") | (string & {}));
/** Pipeline status; null for a client record, or for a status this version does not know. `converted` is not "won". */
"status": ((("new" | "contacted" | "qualified" | "negotiating" | "converted" | "lost" | "archived" | "unreachable") | (string & {})) | null);
/** Who set the current status: a person, the AI, Totem automation, an API caller, or unknown (no recorded transition lands on it). Null when `status` is null. */
"status_set_by": ((("human" | "ai" | "system" | "api" | "unknown") | (string & {})) | null);
/** Why the record was archived, as a closed code; stored free text is `other`. Null when none is stored. */
"archive_reason": ((("opt_out" | "no_consent" | "not_interested" | "not_qualified" | "no_contact" | "merged" | "family_transfer" | "other") | (string & {})) | null);
/** The status the lead had before its current archive; null while it is not archived or when unknown. */
"archived_from_status": ((("new" | "contacted" | "qualified" | "negotiating" | "converted" | "lost" | "archived" | "unreachable") | (string & {})) | null);
/** Contact permissions. Apply them before any outreach from your own systems. */
"contact_permissions": {
/** True when the person asked never to be contacted (the `opt_out` archive reason). Stop every channel. */
"do_not_contact": boolean;
/** True when the person unsubscribed from marketing and follow-up email. */
"email_opt_out": boolean;
/** When the email opt-out was recorded, or null. */
"email_opt_out_at": (string | null);
/** WhatsApp consent: false when refused, true when recorded, null when unknown. */
"whatsapp_consent": (boolean | null);
/** The source of each permission. */
"provenance": {
/** Where `do_not_contact` comes from, or null when it is false. */
"do_not_contact": ((("archive_reason") | (string & {})) | null);
/** Who recorded the email opt-out: the unsubscribe link, a person in Totem, or unknown. Null when there is none. */
"email_opt_out": ((("unsubscribe_link" | "manual" | "unknown") | (string & {})) | null);
/** `archive_reason` when a refusal is recorded as the archive reason; `stored` for the value kept on the record, which team members can edit. Null when unknown. */
"whatsapp_consent": ((("stored" | "archive_reason") | (string & {})) | null)
}
};
/** The lead this record was merged into, or null (also when that lead no longer exists). */
"merged_into": (string | null);
/** Where a transfer to another team of your organization sent this lead, or null. The team may be one your key does not read. */
"transferred_to": ({
/** The destination team. */
"team": string;
/** The destination lead, or null when its id cannot be named across teams: an assistant handoff created it, or the transfer landed on an existing lead-ads lead (Meta, Google Ads or LinkedIn) or another lead with a fixed id. */
"lead": (string | null)
} | null);
/** When the contact last came back on their own and revived an archived lead, or null. */
"revived_at": (string | null);
/** True when the lead was converted with "clear pipeline data": board, stage, priority, assignees, estimated value and the source fields other than `source_channel` are null because they were cleared. */
"pipeline_cleared": boolean;
/** When the lead was converted, while its status is `converted`; otherwise null. */
"converted_at": (string | null);
/** The estimated value when it was converted, in major units. Survives "clear pipeline data". */
"value_at_conversion": (number | null);
/** Priority, or null. */
"priority": ((("low" | "medium" | "high" | "urgent") | (string & {})) | null);
/** Labels as stored. `lead` and `booking` are system labels. */
"tags": Array<string>;
/** The board, resolved through the stage when it has one; or null. */
"board": (string | null);
/** The stage, or null. */
"stage": (string | null);
/** Assigned members, sorted. Null when the record has no pipeline data. */
"assignees": (Array<string> | null);
/** Estimated value in major units as stored (decimals allowed), or null. */
"estimated_value": (number | null);
/** Always null: Totem stores no currency with the value. */
"estimated_value_currency": null;
/** The stored lead source; `api` also covers leads created by Totem itself (for example from a conversation or a call), see `source_detail`. Null when none is stored. */
"source": ((("meta_lead_ads" | "manual" | "website_form" | "booking_page" | "csv_import" | "api" | "chatbot" | "google_ads" | "linkedin" | "other") | (string & {})) | null);
/** The channel the record started on (for example `whatsapp`, `phone`, `widget`), or null. Team members can edit it. */
"source_channel": (string | null);
/** `conversation`, `call`, `external:<provider>`, `gated_ad:<source>`, `family_handoff`, `api_intake` or `unknown`; null when `source` needs no detail. */
"source_detail": (string | null);
/** `server_written` when Totem set the source from what the ad platform reported; otherwise `member_editable` (team members can change it). Null with `source`. */
"source_provenance": ((("server_written" | "member_editable") | (string & {})) | null);
/** When the record was created. */
"created_at": string;
/** Increases every time one of the record's exported fields changes. Apply a change only when its version is greater than the one you hold. */
"version": number;
/** When Totem recorded this version (UTC). It is not the time the business event happened. */
"updated_at": string;
/** The lead's attribution facet, or null while Totem is still preparing it. */
"attribution": (Schemas["LeadAttribution"] | null);
/** The lead's response facet, or null while Totem is still preparing it. */
"response": (Schemas["LeadResponse"] | null)
};
/** A page of Lead objects, in a stable order that carries no meaning. */
"LeadList": {
/** Always `list`. */
"object": "list";
/** The items of this page. */
"data": Array<Schemas["Lead"]>;
/** `true` when another page follows: fetch it with `next_cursor`, even if this page holds fewer items than `limit`. */
"has_more": boolean;
/** Opaque cursor for the next page, or null on the last page. Never parse it. */
"next_cursor": (string | null)
};
/** How the team has answered a lead across its conversations and calls: the latest messages each way and whether a reply is due. It uses its lead's id. */
"LeadResponse": {
/** Public id of the record. */
"id": string;
/** Always `lead_response`. */
"object": "lead_response";
/** `true` for real data; `false` in example data. */
"livemode": boolean;
/** The team this record belongs to. */
"team": string;
/** The latest message from the customer on any of the lead's conversations (UTC), or null. Not counted: erased messages, imported WhatsApp history and web-chat visitor turns. Instagram shares cannot be told apart and count. */
"last_inbound_at": (string | null);
/** The latest message sent to the customer that did not fail, on any of the lead's conversations and whoever sent it (UTC), or null. Imported WhatsApp history counts. */
"last_outbound_at": (string | null);
/** True when `last_inbound_at` is newer than the latest reply on any of the lead's conversations. A reply is a sent message that did not fail and was recorded as a conversation reply or with no purpose; outreach, transactional messages (such as reminders) and imported history do not count. Most stored messages carry no purpose, so an automated send recorded without one also counts as a reply. False when the customer has never written. */
"awaiting_reply": boolean;
/** When the latest of the lead's calls whose `outcome` is `answered_human` or `answered_ai` started (UTC), or null. A connected outbound call on Totem's phone lines reads `unknown`, so it is not counted. */
"last_answered_call_at": (string | null);
/** `delivered`, `read` or `failed` for the latest message sent to the lead on WhatsApp. Null when that message has no receipt yet (`sent` is never stored) or the lead has no message sent on WhatsApp. */
"last_whatsapp_delivery_status": ((("delivered" | "read" | "failed") | (string & {})) | null);
/** What these facts were computed from. */
"coverage": {
/** The lead's conversations these facts were computed from, newest first; at most 20. */
"conversations": number;
/** The lead's calls `last_answered_call_at` was computed from, newest first; at most 50. */
"calls": number;
/** The channels of those conversations that store no delivery receipts (every channel but WhatsApp), sorted. */
"channels_without_delivery_data": Array<(("sms" | "facebook" | "instagram" | "tiktok" | "chatbot" | "email") | (string & {}))>;
/** True when a read limit was reached (20 conversations, 200 messages or 50 calls): older activity was not read, so a time can be null or older than the truth, and `awaiting_reply` can miss an older reply. */
"truncated": boolean
};
/** Increases every time one of the record's exported fields changes. Apply a change only when its version is greater than the one you hold. */
"version": number;
/** When Totem recorded this version (UTC). It is not the time the business event happened. */
"updated_at": string
};
/** The integration that owns the key, with the teams the key reads. */
"Me": {
/** Always `integration`. */
"object": "integration";
/** Public id of the integration. */
"id": string;
/** `true` for a real key; `false` in example data. */
"livemode": boolean;
/** The name an administrator gave the integration. */
"name": string;
/** The key used for this request. */
"key": {
/** The last four characters of the key used for this request. */
"last4": string
};
/** The teams this key reads today. Their details are in `GET /v1/teams`. */
"teams": Array<string>;
/** The key's scopes: the fixed read set in v1.0a. */
"scopes": Array<(("teams:read" | "crm:read" | "calls:read" | "messages:read" | "calendar:read") | (string & {}))>
};
/** A team member, by display name only: Totem exports no email, phone or role. */
"Member": {
/** Public id of the record. */
"id": string;
/** Always `member`. */
"object": "member";
/** `true` for real data; `false` in example data. */
"livemode": boolean;
/** The team this record belongs to. */
"team": string;
/** The member's display name, or first and last name, or null when none is stored. Totem exports no email, phone or role. */
"display_name": (string | null)
};
/** Every Member object, in one response: this list is never paged. */
"MemberList": {
/** Always `list`. */
"object": "list";
/** The items of this page. */
"data": Array<Schemas["Member"]>;
/** `true` when another page follows: fetch it with `next_cursor`, even if this page holds fewer items than `limit`. */
"has_more": boolean;
/** Opaque cursor for the next page, or null on the last page. Never parse it. */
"next_cursor": (string | null)
};
/** An error, as `application/problem+json` (RFC 9457). */
"Problem": {
/** A link to this error's entry in the docs; equal to `doc_url`. */
"type": string;
/** A short summary of the error, in English. It can change: branch on `code`. */
"title": string;
/** The HTTP status. */
"status": number;
/** Machine-readable error code. New codes may appear: handle an unknown one by its status. */
"code": (TotemErrorCode | (string & {}));
/** The `Totem-Request-Id` of the request. Quote it when you contact support. */
"request_id": string;
/** The parameter, header or body field at fault, when there is one. Never its value. */
"param"?: string;
/** The docs entry for this code: when it happens and what to do. */
"doc_url": string
};
/** A team this key reads, with its time zone and default country. */
"Team": {
/** Public id of the record. */
"id": string;
/** Always `team`. */
"object": "team";
/** `true` for real data; `false` in example data. */
"livemode": boolean;
/** The team's name as it appears in Totem, or null when none is stored. */
"name": (string | null);
/** The team's IANA time zone: its business-hours zone when that is valid, otherwise its default country's (Europe/Madrid when neither is set). Interpret the team's local times with it. */
"timezone": string;
/** The team's default country (ISO 3166-1 alpha-2), which Totem uses when someone types a phone number without a prefix; null when none is set. The API does not apply it: `Lead.phone` is validated without a default country, so a number stored without its country prefix reads `phone_status: invalid`. */
"default_country": (string | null)
};
/** Every Team object, in one response: this list is never paged. */
"TeamList": {
/** Always `list`. */
"object": "list";
/** The items of this page. */
"data": Array<Schemas["Team"]>;
/** `true` when another page follows: fetch it with `next_cursor`, even if this page holds fewer items than `limit`. */
"has_more": boolean;
/** Opaque cursor for the next page, or null on the last page. Never parse it. */
"next_cursor": (string | null)
}
}
export interface OperationContracts {
/**
 * Get the integration behind this key
 *
 * Returns the integration this key belongs to: its name, the last four characters of the key, the teams it reads today and its scopes. Call it first to check that a key works and to see which teams it reads; `GET /v1/teams` has their details.
 */
"me.get": { response: Schemas["Me"]; query: {

}; path: {

}; body: never };
/**
 * List the teams this key reads
 *
 * Lists every team this key reads, in one response that is never paged, including teams that are restricted for now (their other endpoints answer `403`). Re-read it on every sync run: a team that is no longer listed has left the key, so delete its copy and its cursor.
 */
"teams.list": { response: Schemas["TeamList"] & {
/** Always `list`. */
"object"?: "list";
/** Every team this key reads, restricted ones included. */
"data"?: Array<Schemas["Team"]>;
/** Always `false`: this list is never paged. */
"has_more"?: false;
/** Always `null`: there is no next page. */
"next_cursor"?: null
}; query: {

}; path: {

}; body: never };
/**
 * Get a team
 *
 * Returns one team this key reads: its name, time zone and default country. A team the key does not read answers `404 resource_missing`.
 */
"teams.get": { response: Schemas["Team"]; query: {

}; path: {
/** The team's public id. */
"id": string
}; body: never };
/**
 * List boards with their stages
 *
 * Returns a page of the team's boards, each with its stages in pipeline order. Boards also arrive in the changes feed; read this list when you need them at once, for example when a lead names a stage you have not seen yet.
 */
"boards.list": { response: Schemas["BoardList"]; query: {
/** Items per page, 1–100. Defaults to 25. */
"limit"?: number | null | undefined;
/** The `next_cursor` of the previous page. Omit it for the first page. */
"cursor"?: string | null | undefined
}; path: {

}; body: never };
/**
 * List team members
 *
 * Lists every member of the team in one response that is never paged and takes no `limit` or `cursor`. Members are not in the changes feed: read this list when you start syncing a team, again when an item names a member you do not know, and at least once a day. A member who leaves the team drops out of the list while older records keep naming its id, so keep a name you need from an earlier read.
 */
"members.list": { response: Schemas["MemberList"] & {
/** Always `list`. */
"object"?: "list";
/** Every member of the team. */
"data"?: Array<Schemas["Member"]>;
/** Always `false`: this list is never paged. */
"has_more"?: false;
/** Always `null`: there is no next page. */
"next_cursor"?: null
}; query: {

}; path: {

}; body: never };
/**
 * List bookable services
 *
 * Lists every bookable service of the team in one response that is never paged and takes no `limit` or `cursor`. Bookable services are not in the changes feed: read this list when you start syncing a team, again when a booking names a service you do not know, and at least once a day. A deleted service drops out of the list while its bookings keep naming its id, so keep a service name you need from an earlier read.
 */
"booking_services.list": { response: Schemas["BookingServiceList"] & {
/** Always `list`. */
"object"?: "list";
/** Every bookable service of the team. */
"data"?: Array<Schemas["BookingService"]>;
/** Always `false`: this list is never paged. */
"has_more"?: false;
/** Always `null`: there is no next page. */
"next_cursor"?: null
}; query: {

}; path: {

}; body: never };
/**
 * List leads
 *
 * Returns a page of the team's leads and clients, in a stable order that carries no meaning. Filter by at most one of `board`, `stage` or `status`; a board or stage the team does not have returns an empty page. To keep a copy up to date, follow the changes feed instead of re-reading this list.
 */
"leads.list": { response: Schemas["LeadList"]; query: {
/** Items per page, 1–100. Defaults to 25. */
"limit"?: number | null | undefined;
/** The `next_cursor` of the previous page. Omit it for the first page. */
"cursor"?: string | null | undefined;
/** Only leads on this board. At most one of `board`, `stage` and `status`. */
"board"?: string | null | undefined;
/** Only leads in this stage. At most one of `board`, `stage` and `status`. */
"stage"?: string | null | undefined;
/** Only leads with this status. At most one of `board`, `stage` and `status`. */
"status"?: ("new" | "contacted" | "qualified" | "negotiating" | "converted" | "lost" | "archived" | "unreachable") | null | undefined
}; path: {

}; body: never };
/**
 * Get a lead with its attribution and response
 *
 * Returns one lead with its two facets: `attribution` (where it came from) and `response` (how the team has answered it), each with its own `version`. A lead created moments ago can answer `404 resource_missing` until Totem has prepared it; the changes feed delivers it then.
 */
"leads.get": { response: Schemas["LeadDetail"]; query: {

}; path: {
/** The lead's public id. */
"id": string
}; body: never };
/**
 * Find leads by exact phone or email
 *
 * Finds the team's leads whose phone or email matches exactly, including archived, merged and client records (follow `merged_into` to the lead that was kept). Send exactly one of `phone` or `email` in the JSON body, never in the URL. Returns at most 10 leads, chosen from the first 20 records that match, in one response that never paginates.
 */
"leads.search": { response: Schemas["LeadList"] & {
/** Always `list`. */
"object"?: "list";
/** The matching leads: at most 10. */
"data"?: Array<Schemas["Lead"]>;
/** Always `false`, even when more records match: search returns at most 10 leads and has no next page. */
"has_more"?: false;
/** Always `null`: search does not paginate. */
"next_cursor"?: null
}; query: {

}; path: {

}; body: ExclusiveUnion<({
/** A phone number in E.164 (`+12025550123`). It finds the number stored in E.164, with or without the `+`, and in the layouts phone libraries write: `+1 202-555-0123`, `(202) 555-0123` and `2025550123`. Other layouts, such as `202 555 0123`, are not found. */
"phone": string
} | {
/** An email address. It finds records stored exactly as sent, or stored in lowercase. */
"email": string
})> };
/**
 * List a lead's activities
 *
 * Returns a page of the lead's activities: each change of its stage, status or assigned members, with when it happened and, when Totem recorded it, who made it. Pages are not in date order, so sort by `occurred_at`. Activities never change once written, and new ones also arrive in the changes feed.
 */
"leads.activities": { response: Schemas["ActivityList"]; query: {
/** Items per page, 1–100. Defaults to 25. */
"limit"?: number | null | undefined;
/** The `next_cursor` of the previous page. Omit it for the first page. */
"cursor"?: string | null | undefined
}; path: {
/** The lead's public id. */
"id": string
}; body: never };
/**
 * List calls
 *
 * Returns a page of the team's calls, each with its direction, start time, duration and a normalized outcome, and linked to its lead when there is one. Pass `lead` for one lead's calls. Recordings and transcripts are not exported.
 */
"calls.list": { response: Schemas["CallList"]; query: {
/** Items per page, 1–100. Defaults to 25. */
"limit"?: number | null | undefined;
/** The `next_cursor` of the previous page. Omit it for the first page. */
"cursor"?: string | null | undefined;
/** Only the calls linked to this lead: every item's `lead` is this id. A lead of another team, or one that does not exist, matches nothing. */
"lead"?: string | null | undefined
}; path: {

}; body: never };
/**
 * Get a call
 *
 * Returns one call by its id. A call this key cannot read, or one that was removed, answers `404 resource_missing`.
 */
"calls.get": { response: Schemas["Call"]; query: {

}; path: {
/** The call's public id. */
"id": string
}; body: never };
/**
 * List conversations
 *
 * Returns a page of the team's conversations, one per channel, business account and contact address: channel, inbox status, assignee and the times of the latest inbound and outbound messages. Pass `lead` for one lead's conversations. Message content is never exported.
 */
"conversations.list": { response: Schemas["ConversationList"]; query: {
/** Items per page, 1–100. Defaults to 25. */
"limit"?: number | null | undefined;
/** The `next_cursor` of the previous page. Omit it for the first page. */
"cursor"?: string | null | undefined;
/** Only the conversations linked to this lead: every item's `lead` is this id. A lead of another team, or one that does not exist, matches nothing. */
"lead"?: string | null | undefined
}; path: {

}; body: never };
/**
 * Get a conversation
 *
 * Returns one conversation by its id, without message content. A conversation this key cannot read, or one that was removed, answers `404 resource_missing`.
 */
"conversations.get": { response: Schemas["Conversation"]; query: {

}; path: {
/** The conversation's public id. */
"id": string
}; body: never };
/**
 * List bookings
 *
 * Returns a page of the team's bookings: appointments for a bookable service, events from the connected calendar and bookings imported from other systems, each with its status and times. Pass `lead` for one lead's bookings.
 */
"bookings.list": { response: Schemas["BookingList"]; query: {
/** Items per page, 1–100. Defaults to 25. */
"limit"?: number | null | undefined;
/** The `next_cursor` of the previous page. Omit it for the first page. */
"cursor"?: string | null | undefined;
/** Only the bookings linked to this lead: every item's `lead` is this id. A lead of another team, or one that does not exist, matches nothing. */
"lead"?: string | null | undefined
}; path: {

}; body: never };
/**
 * Get a booking
 *
 * Returns one booking by its id. A booking this key cannot read, or one that was removed, answers `404 resource_missing`.
 */
"bookings.get": { response: Schemas["Booking"]; query: {

}; path: {
/** The booking's public id. */
"id": string
}; body: never };
/**
 * Read the changes feed of one team
 *
 * Returns the next page of one team's changes, in the order Totem recorded them: each item is a record's current state or its removal. Without `cursor` it starts an initial sync of every record; after applying each page, store its `next_cursor` and send it on the next call, even when the page is empty. A cursor expires 30 days after the point in the feed it reached or, while an initial sync is still running, 30 days after that sync started.
 */
"sync.changes": { response: Schemas["FeedPage"]; query: {
/** The `next_cursor` of the previous page. Omit it to start an initial sync from the beginning. */
"cursor"?: string | null | undefined;
/** Items per page, 1–100. Defaults to 25. */
"limit"?: number | null | undefined
}; path: {

}; body: never };
/**
 * Check that the API is up
 *
 * Tells you whether the API is up; call it with `GET`, because the firewall in front of the API answers any other method, `HEAD` included, with a plain `404`. It needs no key and takes no query string: any parameter, even a cache-buster, answers `400 invalid_request`. The `Totem-Release` response header names the release that answered.
 */
"health": { response: Schemas["Health"]; query: {

}; path: {

}; body: never }
}
/** One stage, status or assignee transition of a lead. Activities never change once written. */
export type Activity = Schemas["Activity"]
/** A page of Activity objects, in a stable order that carries no meaning. */
export type ActivityList = Schemas["ActivityList"]
/** A board with its stages in pipeline order. */
export type Board = Schemas["Board"]
/** A page of Board objects, in a stable order that carries no meaning. */
export type BoardList = Schemas["BoardList"]
/** A booking and its `kind`: an appointment for a bookable service, an event from the connected calendar, or a booking imported from another system. */
export type Booking = Schemas["Booking"]
/** A page of Booking objects, in a stable order that carries no meaning. */
export type BookingList = Schemas["BookingList"]
/** A service customers can book, with its meeting type. */
export type BookingService = Schemas["BookingService"]
/** Every BookingService object, in one response: this list is never paged. */
export type BookingServiceList = Schemas["BookingServiceList"]
/** A call: its direction, timing and a normalized outcome. No recording or transcript. */
export type Call = Schemas["Call"]
/** A page of Call objects, in a stable order that carries no meaning. */
export type CallList = Schemas["CallList"]
/** A conversation on one channel: its status, assignee and the times of the latest messages, never their content. */
export type Conversation = Schemas["Conversation"]
/** A page of Conversation objects, in a stable order that carries no meaning. */
export type ConversationList = Schemas["ConversationList"]
/** One change: the record's current state, or its removal. */
export type FeedItem = Schemas["FeedItem"]
/** A page of the changes feed. */
export type FeedPage = Schemas["FeedPage"]
/** The API is up. */
export type Health = Schemas["Health"]
/** A lead or client record: lead fields only. */
export type Lead = Schemas["Lead"]
/** Where a lead came from: its original capture and latest submission. */
export type LeadAttribution = Schemas["LeadAttribution"]
/** A lead with its `attribution` and `response` facets, each with its own `version`. A facet is `null` only while Totem is still preparing it. */
export type LeadDetail = Schemas["LeadDetail"]
/** A page of Lead objects, in a stable order that carries no meaning. */
export type LeadList = Schemas["LeadList"]
/** How the team has answered a lead across its conversations and calls: the latest messages each way and whether a reply is due. It uses its lead's id. */
export type LeadResponse = Schemas["LeadResponse"]
/** The integration that owns the key, with the teams the key reads. */
export type Me = Schemas["Me"]
/** A team member, by display name only: Totem exports no email, phone or role. */
export type Member = Schemas["Member"]
/** Every Member object, in one response: this list is never paged. */
export type MemberList = Schemas["MemberList"]
/** An error, as `application/problem+json` (RFC 9457). */
export type Problem = Schemas["Problem"]
/** A team this key reads, with its time zone and default country. */
export type Team = Schemas["Team"]
/** Every Team object, in one response: this list is never paged. */
export type TeamList = Schemas["TeamList"]
