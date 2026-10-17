/** Generated from openapi.json. Do not edit; run npm run generate. */
type UnionKeys<T> = T extends unknown ? keyof T : never
type ExclusiveUnion<T, All = T> = T extends unknown ? T & Partial<Record<Exclude<UnionKeys<All>, keyof T>, never>> : never
export interface Schemas {
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
/** Who made the change: a person, the AI, Totem automation, an API caller, or unknown (no status marker, as for a stage-only or assignee-only change). */
"actor_kind": ("human" | "ai" | "system" | "api" | "unknown");
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
"from": (("new" | "contacted" | "qualified" | "negotiating" | "converted" | "lost" | "archived" | "unreachable") | null);
/** The status after. */
"to": ("new" | "contacted" | "qualified" | "negotiating" | "converted" | "lost" | "archived" | "unreachable");
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
/** Who made the change: a person, the AI, Totem automation, an API caller, or unknown (no status marker, as for a stage-only or assignee-only change). */
"actor_kind": ("human" | "ai" | "system" | "api" | "unknown");
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
/** Who made the change: a person, the AI, Totem automation, an API caller, or unknown (no status marker, as for a stage-only or assignee-only change). */
"actor_kind": ("human" | "ai" | "system" | "api" | "unknown");
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
/** The board's stages, ordered by position, then by id. */
"stages": Array<{
/** Always `stage`. */
"object": "stage";
/** Public id of the stage; a lead's `stage` names it. */
"id": string;
/** The stage's name, or null when none is stored. */
"name": (string | null);
/** The stage's position on its board, left to right; null when none is stored. Stages are listed in this order. */
"position": (number | null);
/** True for the stage new leads of this board enter. */
"is_default": boolean;
/** True for a final stage: moving a lead here marks it converted. */
"is_final": boolean;
/** True for an archive stage, whose leads are hidden from the main board view. */
"is_archive": boolean;
/** Who moves leads: `standard` (people only), `supervised` (AI may move leads in, people move them out) or `automated` (AI runs outreach and moves leads in and out); null for a value this version does not know. */
"mode": (("standard" | "supervised" | "automated") | null)
}>;
/** Increases every time one of the record's exported fields changes. Apply a change only when its version is greater than the one you hold. */
"version": number;
/** When Totem recorded this version (UTC). It is not the time the business event happened. */
"updated_at": string
};
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
/** `service_booking` (booked for a bookable service, by the AI, a customer or a person), `calendar_event` (an event from the connected calendar) or `external_import` (synced from an external booking system or read from a portal email). */
"kind": ("service_booking" | "calendar_event" | "external_import");
/** The booked service (see `/booking_services`) on a `service_booking`; null otherwise. */
"service": (string | null);
/** `scheduled`, `rescheduled`, `cancelled`, `postponed`, `attended`, `no_show` or `team_no_show` (attendance is recorded only by people); null for a value this version does not know. */
"status": (("scheduled" | "rescheduled" | "cancelled" | "postponed" | "attended" | "no_show" | "team_no_show") | null);
/** When the booking starts (UTC). */
"starts_at": (string | null);
/** When the booking ends (UTC). */
"ends_at": (string | null);
/** `online`, `in_person` or `phone`; null when not stored. */
"meeting_type": (("online" | "in_person" | "phone") | null);
/** Who booked it: `ai`, `customer` or `operator`; null when not recorded. */
"source": (("ai" | "customer" | "operator") | null);
/** The booking this one replaced in a reschedule, or null. For a few seconds the replaced booking can still read `scheduled`; bookings rescheduled before Totem started recording this link may not have it. */
"rescheduled_from": (string | null);
/** The booking that replaced this one in a reschedule, or null. */
"rescheduled_to": (string | null);
/** When the booking was recorded in Totem (UTC). */
"created_at": (string | null);
/** Increases every time one of the record's exported fields changes. Apply a change only when its version is greater than the one you hold. */
"version": number;
/** When Totem recorded this version (UTC). It is not the time the business event happened. */
"updated_at": string
};
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
"meeting_type": ("online" | "in_person" | "phone")
};
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
"direction": (("inbound" | "outbound") | null);
/** When the call started (UTC), or when it was recorded if the provider gave no start time. */
"started_at": (string | null);
/** Whole seconds of the call (rounded down); null when not stored. */
"duration_seconds": (number | null);
/** How the call ended: `answered_human`, `answered_ai`, `voicemail`, `no_answer`, `busy`, `failed`, or `unknown` (still live, or no evidence of who answered). Read it with `outcome_basis`. */
"outcome": ("answered_human" | "answered_ai" | "voicemail" | "no_answer" | "busy" | "failed" | "unknown");
/** The evidence behind `outcome`: `inbound_verdict` (Totem's classification of an inbound call), `ai_analysis` (the AI voice provider's result), `duration_floor` (a human-line call of at least 10 seconds counts as answered), `carrier_answer_only` (only the carrier's answer signal, which never counts as answered: a connected call reads `unknown`), `browser_session` (a web voice session with the assistant), or `none`. */
"outcome_basis": ("inbound_verdict" | "ai_analysis" | "duration_floor" | "carrier_answer_only" | "browser_session" | "none");
/** Increases every time one of the record's exported fields changes. Apply a change only when its version is greater than the one you hold. */
"version": number;
/** When Totem recorded this version (UTC). It is not the time the business event happened. */
"updated_at": string
};
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
/** The channel: `whatsapp`, `email`, `chatbot` (the web chat), `facebook`, `instagram`, `sms` or `tiktok`; null for a value this version does not know. A lead can have one conversation per channel and business account. */
"channel_type": (("sms" | "whatsapp" | "facebook" | "instagram" | "tiktok" | "chatbot" | "email") | null);
/** `active` or `archived` in the team's inbox; null for a value this version does not know. */
"status": (("active" | "archived") | null);
/** The team member assigned to the conversation (see `/members`), or null. */
"assignee": (string | null);
/** Who answers now: `human` while a person has taken the conversation over, `ai` otherwise. A timed takeover returns to `ai` when it expires, and the record's version changes then. */
"reply_mode": ("ai" | "human");
/** When the conversation was created (UTC). */
"created_at": (string | null);
/** The latest customer message (UTC). Not counted: erased messages, imported WhatsApp history and web-chat visitor turns, so a `chatbot` conversation reads null. Instagram shares cannot be told apart and count. */
"last_inbound_at": (string | null);
/** The latest message sent to the customer that did not fail (UTC), whoever sent it. */
"last_outbound_at": (string | null);
/** Increases every time one of the record's exported fields changes. Apply a change only when its version is greater than the one you hold. */
"version": number;
/** When Totem recorded this version (UTC). It is not the time the business event happened. */
"updated_at": string
};
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
"FeedItem": ExclusiveUnion<({
/** Always `lead` in this variant. */
"kind": "lead";
/** Public id of the record; the facets `lead_attribution` and `lead_response` use their lead's id. */
"id": string;
/** The record's version. Apply the item only when it is greater than the version you hold. */
"version": number;
"object": Schemas["Lead"]
} | {
/** Always `lead_attribution` in this variant. */
"kind": "lead_attribution";
/** Public id of the record; the facets `lead_attribution` and `lead_response` use their lead's id. */
"id": string;
/** The record's version. Apply the item only when it is greater than the version you hold. */
"version": number;
"object": Schemas["LeadAttribution"]
} | {
/** Always `lead_response` in this variant. */
"kind": "lead_response";
/** Public id of the record; the facets `lead_attribution` and `lead_response` use their lead's id. */
"id": string;
/** The record's version. Apply the item only when it is greater than the version you hold. */
"version": number;
"object": Schemas["LeadResponse"]
} | {
/** Always `activity` in this variant. */
"kind": "activity";
/** Public id of the record; the facets `lead_attribution` and `lead_response` use their lead's id. */
"id": string;
/** The record's version. Apply the item only when it is greater than the version you hold. */
"version": number;
"object": Schemas["Activity"]
} | {
/** Always `call` in this variant. */
"kind": "call";
/** Public id of the record; the facets `lead_attribution` and `lead_response` use their lead's id. */
"id": string;
/** The record's version. Apply the item only when it is greater than the version you hold. */
"version": number;
"object": Schemas["Call"]
} | {
/** Always `conversation` in this variant. */
"kind": "conversation";
/** Public id of the record; the facets `lead_attribution` and `lead_response` use their lead's id. */
"id": string;
/** The record's version. Apply the item only when it is greater than the version you hold. */
"version": number;
"object": Schemas["Conversation"]
} | {
/** Always `booking` in this variant. */
"kind": "booking";
/** Public id of the record; the facets `lead_attribution` and `lead_response` use their lead's id. */
"id": string;
/** The record's version. Apply the item only when it is greater than the version you hold. */
"version": number;
"object": Schemas["Booking"]
} | {
/** Always `board` in this variant. */
"kind": "board";
/** Public id of the record; the facets `lead_attribution` and `lead_response` use their lead's id. */
"id": string;
/** The record's version. Apply the item only when it is greater than the version you hold. */
"version": number;
"object": Schemas["Board"]
} | {
/** The kind of the removed record. */
"kind": ("lead" | "lead_attribution" | "lead_response" | "activity" | "call" | "conversation" | "booking" | "board");
/** Public id of the removed record. */
"id": string;
/** The record's version. Apply the item only when it is greater than the version you hold. */
"version": number;
/** Present only on a removal. */
"removed": {
/** `erased` after a privacy erasure, `deleted` otherwise. Either way, delete your copy and keep this version, so an older copy delivered later is ignored. */
"reason": ("erased" | "deleted")
}
})>;
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
"Health": {
/** Always `health`. */
"object": "health";
/** Always `ok`: when the API is not available, the answer is an error instead. */
"status": "ok"
};
"Lead": {
/** Public id of the record. */
"id": string;
/** Always `lead`. */
"object": "lead";
/** `true` for real data; `false` in example data. */
"livemode": boolean;
/** The team the record belongs to. */
"team": string;
/** `lead` when the record has one of the eight statuses, otherwise `client`. */
"record_kind": ("lead" | "client");
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
/** `valid` (see `phone`), `invalid` (a number is stored but does not validate) or `missing`. */
"phone_status": ("valid" | "invalid" | "missing");
/** Pipeline status, or null for a client record. `converted` is not "won". */
"status": (("new" | "contacted" | "qualified" | "negotiating" | "converted" | "lost" | "archived" | "unreachable") | null);
/** Who set the current status: a person, the AI, Totem automation, an API caller, or unknown (no recorded transition lands on it). Null when `status` is null. */
"status_set_by": (("human" | "ai" | "system" | "api" | "unknown") | null);
/** Why the record was archived, as a closed code; stored free text is `other`. Null when none is stored. */
"archive_reason": (("opt_out" | "no_consent" | "not_interested" | "not_qualified" | "no_contact" | "merged" | "family_transfer" | "other") | null);
/** The status the lead had before its current archive; null while it is not archived or when unknown. */
"archived_from_status": (("new" | "contacted" | "qualified" | "negotiating" | "converted" | "lost" | "archived" | "unreachable") | null);
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
"do_not_contact": (("archive_reason") | null);
/** Who recorded the email opt-out: the unsubscribe link, a person in Totem, or unknown. Null when there is none. */
"email_opt_out": (("unsubscribe_link" | "manual" | "unknown") | null);
/** `archive_reason` when a refusal is recorded as the archive reason; `stored` for the value kept on the record, which team members can edit. Null when unknown. */
"whatsapp_consent": (("stored" | "archive_reason") | null)
}
};
/** The lead this record was merged into, or null (also when that lead no longer exists). */
"merged_into": (string | null);
/** Where a transfer to another team of your organization sent this lead, or null. The team may be one your key does not read. */
"transferred_to": ({
/** The destination team. */
"team": string;
/** The destination lead, or null when an assistant handoff created it. */
"lead": (string | null)
} | null);
/** When the contact last came back on their own and revived an archived lead, or null. */
"revived_at": (string | null);
/** True when the lead was converted with "clear pipeline data": board, stage, priority, assignees, estimated value and source fields are null because they were cleared. */
"pipeline_cleared": boolean;
/** When the lead was converted, while its status is `converted`; otherwise null. */
"converted_at": (string | null);
/** The estimated value when it was converted, in major units. Survives "clear pipeline data". */
"value_at_conversion": (number | null);
/** Priority, or null. */
"priority": (("low" | "medium" | "high" | "urgent") | null);
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
"source": (("meta_lead_ads" | "manual" | "website_form" | "booking_page" | "csv_import" | "api" | "chatbot" | "google_ads" | "linkedin" | "other") | null);
/** The channel the record started on (for example `whatsapp`, `phone`, `widget`), or null. Team members can edit it. */
"source_channel": (string | null);
/** `conversation`, `call`, `external:<provider>`, `gated_ad:<source>`, `family_handoff`, `api_intake` or `unknown`; null when `source` needs no detail. */
"source_detail": (string | null);
/** `server_written` when Totem set the source from what the ad platform reported; otherwise `member_editable` (team members can change it). Null with `source`. */
"source_provenance": (("server_written" | "member_editable") | null);
/** When the record was created. */
"created_at": string;
/** Increases every time one of the record's exported fields changes. Apply a change only when its version is greater than the one you hold. */
"version": number;
/** When Totem recorded this version (UTC). It is not the time the business event happened. */
"updated_at": string
};
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
/** `at_creation`: frozen from the lead as it was first saved. `at_activation`: copied once from the lead as it was when the API was activated (a lead created before Totem started recording attribution). */
"capture": ("at_creation" | "at_activation");
/** When the record was written. */
"captured_at": string;
/** The lead source at capture, or null. */
"source": (string | null);
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
/** The conversation or call that created the lead (never its id), or null. */
"origin": ({
/** `conversation` or `call`. */
"kind": string;
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
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
};
/** Its name. */
"name": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
}
};
/** The ad. */
"ad": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
};
/** Its name. */
"name": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
}
};
/** The Meta ad set. */
"ad_set": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
};
/** Its name. */
"name": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
}
};
/** The Google Ads ad group. */
"ad_group": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
}
};
/** The lead form. */
"form": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
};
/** Its name. */
"name": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
}
};
/** The creative. */
"creative": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
}
};
/** The Google Ads asset group. */
"asset_group": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
}
};
/** The Facebook page. */
"page": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
};
/** Its name. */
"name": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
}
};
/** The five standard UTM keys, or null when none was captured. */
"utm": ({
/** `utm_source`. */
"source": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
};
/** `utm_medium`. */
"medium": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
};
/** `utm_campaign`. */
"campaign": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
};
/** `utm_term`. */
"term": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
};
/** `utm_content`. */
"content": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
}
} | null);
/** The network of the first click id (`google` or `meta`). The click id itself is never kept. */
"click_network": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
};
/** The first Meta ad referral of the conversation that created the lead, or null. */
"ad_referral": ({
/** The channel. */
"channel": ("whatsapp" | "facebook" | "instagram");
/** What opened the conversation. */
"source_type": ("ad" | "post" | "link" | "other");
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
/** Its lead there, or null when an assistant handed off a caller without one. */
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
"original_capture_missing_reason": (("not_captured") | null);
/** The newest ad submission recorded for this lead, including a repeat on an existing contact; null when none is recorded. */
"latest_submission": ({
/** The ad platform. */
"provider": ("meta" | "google_ads" | "linkedin");
/** When the platform says it was submitted, or null. */
"submitted_at": (string | null);
/** The campaign. */
"campaign": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
};
/** Its name. */
"name": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
}
};
/** The ad. */
"ad": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
};
/** Its name. */
"name": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
}
};
/** The Meta ad set. */
"ad_set": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
};
/** Its name. */
"name": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
}
};
/** The Google Ads ad group. */
"ad_group": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
}
};
/** The lead form. */
"form": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
};
/** Its name. */
"name": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
}
};
/** The creative. */
"creative": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
}
};
/** The Google Ads asset group. */
"asset_group": {
/** Its id. */
"id": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
}
};
/** Its UTM keys, or null. */
"utm": ({
/** `utm_source`. */
"source": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
};
/** `utm_medium`. */
"medium": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
};
/** `utm_campaign`. */
"campaign": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
};
/** `utm_term`. */
"term": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
};
/** `utm_content`. */
"content": {
/** The value, or null when it was not captured. */
"value": (string | null);
/** `provider` (reported by the ad platform), `team_alias` (typed by staff), `stored_metadata` (editable lead data), `stored_metadata_at_activation` (copied once when the API was activated, for a lead created before capture), or `not_captured` exactly when `value` is null. */
"provenance": ("provider" | "team_alias" | "stored_metadata" | "stored_metadata_at_activation" | "not_captured")
}
} | null);
/** When this submission stops being readable (Google Ads and LinkedIn keep it 90 days); null for Meta. */
"expires_at": (string | null)
} | null);
/** `not_captured` when `latest_submission` is null, otherwise null. */
"latest_submission_missing_reason": (("not_captured") | null);
/** Increases every time one of the record's exported fields changes. Apply a change only when its version is greater than the one you hold. */
"version": number;
/** When Totem recorded this version (UTC). It is not the time the business event happened. */
"updated_at": string
};
"LeadDetail": {
/** Public id of the record. */
"id": string;
/** Always `lead`. */
"object": "lead";
/** `true` for real data; `false` in example data. */
"livemode": boolean;
/** The team the record belongs to. */
"team": string;
/** `lead` when the record has one of the eight statuses, otherwise `client`. */
"record_kind": ("lead" | "client");
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
/** `valid` (see `phone`), `invalid` (a number is stored but does not validate) or `missing`. */
"phone_status": ("valid" | "invalid" | "missing");
/** Pipeline status, or null for a client record. `converted` is not "won". */
"status": (("new" | "contacted" | "qualified" | "negotiating" | "converted" | "lost" | "archived" | "unreachable") | null);
/** Who set the current status: a person, the AI, Totem automation, an API caller, or unknown (no recorded transition lands on it). Null when `status` is null. */
"status_set_by": (("human" | "ai" | "system" | "api" | "unknown") | null);
/** Why the record was archived, as a closed code; stored free text is `other`. Null when none is stored. */
"archive_reason": (("opt_out" | "no_consent" | "not_interested" | "not_qualified" | "no_contact" | "merged" | "family_transfer" | "other") | null);
/** The status the lead had before its current archive; null while it is not archived or when unknown. */
"archived_from_status": (("new" | "contacted" | "qualified" | "negotiating" | "converted" | "lost" | "archived" | "unreachable") | null);
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
"do_not_contact": (("archive_reason") | null);
/** Who recorded the email opt-out: the unsubscribe link, a person in Totem, or unknown. Null when there is none. */
"email_opt_out": (("unsubscribe_link" | "manual" | "unknown") | null);
/** `archive_reason` when a refusal is recorded as the archive reason; `stored` for the value kept on the record, which team members can edit. Null when unknown. */
"whatsapp_consent": (("stored" | "archive_reason") | null)
}
};
/** The lead this record was merged into, or null (also when that lead no longer exists). */
"merged_into": (string | null);
/** Where a transfer to another team of your organization sent this lead, or null. The team may be one your key does not read. */
"transferred_to": ({
/** The destination team. */
"team": string;
/** The destination lead, or null when an assistant handoff created it. */
"lead": (string | null)
} | null);
/** When the contact last came back on their own and revived an archived lead, or null. */
"revived_at": (string | null);
/** True when the lead was converted with "clear pipeline data": board, stage, priority, assignees, estimated value and source fields are null because they were cleared. */
"pipeline_cleared": boolean;
/** When the lead was converted, while its status is `converted`; otherwise null. */
"converted_at": (string | null);
/** The estimated value when it was converted, in major units. Survives "clear pipeline data". */
"value_at_conversion": (number | null);
/** Priority, or null. */
"priority": (("low" | "medium" | "high" | "urgent") | null);
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
"source": (("meta_lead_ads" | "manual" | "website_form" | "booking_page" | "csv_import" | "api" | "chatbot" | "google_ads" | "linkedin" | "other") | null);
/** The channel the record started on (for example `whatsapp`, `phone`, `widget`), or null. Team members can edit it. */
"source_channel": (string | null);
/** `conversation`, `call`, `external:<provider>`, `gated_ad:<source>`, `family_handoff`, `api_intake` or `unknown`; null when `source` needs no detail. */
"source_detail": (string | null);
/** `server_written` when Totem set the source from what the ad platform reported; otherwise `member_editable` (team members can change it). Null with `source`. */
"source_provenance": (("server_written" | "member_editable") | null);
/** When the record was created. */
"created_at": string;
/** Increases every time one of the record's exported fields changes. Apply a change only when its version is greater than the one you hold. */
"version": number;
/** When Totem recorded this version (UTC). It is not the time the business event happened. */
"updated_at": string;
"attribution": (Schemas["LeadAttribution"] | null);
"response": (Schemas["LeadResponse"] | null)
};
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
/** The latest message sent to the customer that did not fail, on any of the lead's conversations and whoever sent it (UTC), or null. */
"last_outbound_at": (string | null);
/** True when `last_inbound_at` is newer than the latest reply on any of the lead's conversations. A reply is a sent message that did not fail and was recorded as a conversation reply or with no purpose; outreach, transactional messages (such as reminders) and imported history do not count. Most stored messages carry no purpose, so an automated send recorded without one also counts as a reply. False when the customer has never written. */
"awaiting_reply": boolean;
/** When the latest of the lead's calls whose `outcome` is `answered_human` or `answered_ai` started (UTC), or null. */
"last_answered_call_at": (string | null);
/** `delivered`, `read` or `failed` for the latest message sent to the lead on WhatsApp. Null when that message has no receipt yet (`sent` is never stored) or the lead has no message sent on WhatsApp. */
"last_whatsapp_delivery_status": (("delivered" | "read" | "failed") | null);
/** What these facts were computed from. */
"coverage": {
/** The lead's conversations these facts were computed from, newest first; at most 20. */
"conversations": number;
/** The lead's calls `last_answered_call_at` was computed from, newest first; at most 50. */
"calls": number;
/** The channels of those conversations that store no delivery receipts (every channel but WhatsApp), sorted. */
"channels_without_delivery_data": Array<("sms" | "facebook" | "instagram" | "tiktok" | "chatbot" | "email")>;
/** True when a read limit was reached (20 conversations, 200 messages or 50 calls): older activity was not read, so a time can be null or older than the truth, and `awaiting_reply` can miss an older reply. */
"truncated": boolean
};
/** Increases every time one of the record's exported fields changes. Apply a change only when its version is greater than the one you hold. */
"version": number;
/** When Totem recorded this version (UTC). It is not the time the business event happened. */
"updated_at": string
};
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
"scopes": Array<("teams:read" | "crm:read" | "calls:read" | "messages:read" | "calendar:read")>
};
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
"Problem": {
/** A link to this error's entry in the docs; equal to `doc_url`. */
"type": string;
/** A short summary of the error, in English. It can change: branch on `code`. */
"title": string;
/** The HTTP status. */
"status": number;
/** Machine-readable error code. New codes may appear: handle an unknown one by its status. */
"code": (("invalid_request" | "team_required" | "secret_key_in_browser" | "invalid_credentials" | "key_expired" | "insufficient_scope" | "plan_not_entitled" | "ip_not_allowed" | "team_state_restricted" | "sector_restricted" | "capability_disabled" | "resource_missing" | "team_not_accessible" | "resync_required" | "capture_not_ready" | "sync_cursor_expired" | "rate_limited" | "quota_exceeded" | "internal_error" | "api_disabled" | "service_unavailable") | string);
/** The `Totem-Request-Id` of the request. Quote it when you contact support. */
"request_id": string;
/** The parameter, header or body field at fault, when there is one. Never its value. */
"param"?: string;
/** The docs entry for this code: when it happens and what to do. */
"doc_url": string
};
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
/** The team's default country (ISO 3166-1 alpha-2), used to read phone numbers written without a prefix; null when none is set. */
"default_country": (string | null)
};
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
"me.get": { response: Schemas["Me"]; query: {

}; path: {

}; body: never };
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
"teams.get": { response: Schemas["Team"]; query: {

}; path: {
"id": string
}; body: never };
"boards.list": { response: Schemas["BoardList"]; query: {
"limit"?: number;
"cursor"?: string
}; path: {

}; body: never };
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
"leads.list": { response: Schemas["LeadList"]; query: {
"limit"?: number;
"cursor"?: string;
"board"?: string;
"stage"?: string;
"status"?: ("new" | "contacted" | "qualified" | "negotiating" | "converted" | "lost" | "archived" | "unreachable")
}; path: {

}; body: never };
"leads.get": { response: Schemas["LeadDetail"]; query: {

}; path: {
"id": string
}; body: never };
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
/** A phone number in E.164 (`+12025550123`). It finds records stored in E.164, with or without the `+`; a record stored with spaces or a national prefix is not found. */
"phone": string
} | {
/** An email address. It finds records stored exactly as sent, or stored in lowercase. */
"email": string
})> };
"leads.activities": { response: Schemas["ActivityList"]; query: {
"limit"?: number;
"cursor"?: string
}; path: {
"id": string
}; body: never };
"calls.list": { response: Schemas["CallList"]; query: {
"limit"?: number;
"cursor"?: string
}; path: {

}; body: never };
"calls.get": { response: Schemas["Call"]; query: {

}; path: {
"id": string
}; body: never };
"conversations.list": { response: Schemas["ConversationList"]; query: {
"limit"?: number;
"cursor"?: string
}; path: {

}; body: never };
"conversations.get": { response: Schemas["Conversation"]; query: {

}; path: {
"id": string
}; body: never };
"bookings.list": { response: Schemas["BookingList"]; query: {
"limit"?: number;
"cursor"?: string
}; path: {

}; body: never };
"bookings.get": { response: Schemas["Booking"]; query: {

}; path: {
"id": string
}; body: never };
"sync.changes": { response: Schemas["FeedPage"]; query: {
"cursor"?: string;
"limit"?: number
}; path: {

}; body: never };
"health": { response: Schemas["Health"]; query: {

}; path: {

}; body: never }
}
