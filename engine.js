function evaluate(req, threshold, refundAmt) {
  switch (req.kind) {
    case "vip_cancel": {
      const isVip = VIP_LIST.some((n) => req.who.includes(n.split(",")[0]));
      return {
        bucket: "assign",
        confidence: 88,
        action:
          "Assign to senior staff for a personal call — offer priority rebooking, do not just log the cancellation.",
        owner: "Staff B (you're free)",
        response:
          '"Totally understand — I\'ll hold your favorite table for your next visit and text you first pick of new dates. Anything I can do to make tonight up to you?"',
        reasons: [
          isVip
            ? "Matched against the VIP list — high lifetime value, relationship risk if handled generically."
            : "Not matched on VIP list — treat as standard cancellation.",
          "No refund or money involved, so no approval gate applies.",
          "Judgment call (what to offer, tone) benefits from a human, so AI assigns rather than auto-responds.",
        ],
      };
    }

    case "vip_double_charge": {
      const overThreshold = refundAmt > threshold;

      if (overThreshold) {
        return {
          bucket: "escalate",
          confidence: 92,
          action: `Refund owed ($${refundAmt}) exceeds the $${threshold} threshold — escalate to manager, same rule as any customer. Flag as VIP so it jumps the manager's queue.`,
          owner: "Manager (approval required — VIP flagged)",
          response:
            "\"I completely understand how frustrating this is — because you're one of our regulars, I'm making sure our manager handles this personally, right away.\"",
          reasons: [
            "Two rules apply at once here: VIP protocol (fast, personal handling) and the refund-approval threshold (amount-based, not status-based).",
            `Money rule wins on authorization — $${refundAmt} is still above the $${threshold} limit, so the AI can't issue the refund itself, VIP or not.`,
            "VIP rule wins on priority and tone — the case jumps the manager's queue and gets a warmer response than a standard escalation.",
            "Status doesn't buy an exception to the money rule, but it does buy speed and a better experience around it.",
          ],
        };
      }

      return {
        bucket: "assign",
        confidence: 80,
        action: `Refund owed ($${refundAmt}) is within the $${threshold} limit — the AI is technically authorized to auto-refund, but because this is a VIP, assign to a senior staff member instead of an automated message.`,
        owner: "Staff B (VIP relationship)",
        response:
          "\"I've flagged this for our team to personally reach out and make this right — you'll hear from us within the hour, refund included.\"",
        reasons: [
          `$${refundAmt} is at or below the $${threshold} threshold — a normal customer here would be auto-refunded instantly.`,
          "This customer is VIP, so the AI deliberately skips the fully-automated path even though it's allowed to take it.",
          "The risk of a generic auto-reply damaging a high-value relationship outweighs the small time saved by automating it.",
          "This is the edge case: the AI holds back not from lack of authorization, but because the relationship stakes call for a human touch.",
        ],
      };
    }

    case "new_booking": {
      const slotsLeft = 3;
      return {
        bucket: "auto",
        confidence: 97,
        action: `Auto-check availability (${slotsLeft} slots left) and confirm the earliest slot instantly.`,
        owner: "AI system (no staff needed)",
        response:
          '"You\'re booked for 5:30pm today, table for 2 — confirmation sent to your email. See you soon!"',
        reasons: [
          "Deterministic task: slot availability is a simple lookup, low risk of a wrong call.",
          "Time-sensitive — slots are scarce (3 left), so instant confirmation avoids losing the booking to a competitor.",
          "No money movement and no policy exception involved.",
        ],
      };
    }

    case "double_charge": {
      const overThreshold = refundAmt > threshold;
      if (overThreshold) {
        return {
          bucket: "escalate",
          confidence: 90,
          action: `Refund owed ($${refundAmt}) exceeds the $${threshold} manager-approval limit — draft response only, route to manager for refund approval.`,
          owner: "Manager (approval required)",
          response:
            "\"I can see the double charge on your account and I'm escalating this to my manager right now to get it reversed — you'll have confirmation within the hour.\"",
          reasons: [
            `$${refundAmt} owed is above the $${threshold} threshold set for manager approval.`,
            "This is the deliberate edge case: the AI classifies and drafts the reply, but does not move money it isn't authorized to move.",
            "High financial + reputational risk if mishandled (chargeback risk) — flagged as top priority for a human.",
          ],
        };
      }
      return {
        bucket: "auto",
        confidence: 93,
        action: `Refund owed ($${refundAmt}) is within the $${threshold} limit — auto-process the refund immediately.`,
        owner: "AI system (no staff needed)",
        response:
          "\"You're right, that's a duplicate charge — I've refunded $" +
          refundAmt +
          ' back to your card now. Sorry for the trouble!"',
        reasons: [
          `$${refundAmt} owed is at or below the $${threshold} approval threshold, so it's within the AI's authorized range.`,
          "Clear-cut duplicate charge, verifiable against transaction records.",
          "Fast resolution reduces chargeback and reputational risk without needing manager time.",
        ],
      };
    }

    case "pricing_faq": {
      return {
        bucket: "auto",
        confidence: 95,
        action:
          "Match question against knowledge base and auto-send the answer.",
        owner: "AI system (no staff needed)",
        response:
          '"The tasting menu is $85 per person and doesn\'t include drinks — wine pairings are available for an extra $40."',
        reasons: [
          "Matched directly to an existing knowledge-base entry, high-confidence answer.",
          "No account, money, or policy exception involved — safe to fully automate.",
          "Frees staff time for the requests that actually need judgment.",
        ],
      };
    }

    case "urgent_threat": {
      return {
        bucket: "escalate",
        confidence: 75,
        action:
          "Send an immediate holding response and assign to the staff member on the floor now — do not attempt to resolve or placate automatically.",
        owner: "Staff A (you)",
        response:
          "\"I'm so sorry — I'm coming to your table personally right now to fix this.\"",
        reasons: [
          "Explicit reputational threat (public review) combined with a repeated service failure — high stakes for a wrong tone.",
          "Lower AI confidence (75%) on what will actually satisfy the customer — this needs in-person judgment, not a scripted reply.",
          "Time-critical: mid-service, so it's assigned instantly rather than queued.",
        ],
      };
    }
  }
}

function priorityScore(req, evalResult) {
  const base = {
    double_charge: 95,
    vip_double_charge: 102,
    urgent_threat: 90,
    vip_cancel: 60,
    new_booking: 40,
    pricing_faq: 20,
  }[req.kind];
  return evalResult.bucket === "escalate" && req.kind === "double_charge"
    ? base + 5
    : base;
}
