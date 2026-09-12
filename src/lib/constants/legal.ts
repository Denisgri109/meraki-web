/**
 * Plain-text factory defaults for the legal documents.
 *
 * These are used to pre-populate the owner editor when no custom override
 * exists in `global_settings` yet (keys: `legal.tos_body`,
 * `legal.privacy_policy_body`, `legal.cookie_policy_body`,
 * `legal.refund_policy_body`, `legal.accessibility_statement_body`).
 * The rendered pages still show the rich, sectioned default markup until an
 * override is saved.
 *
 * Jurisdiction: Republic of Ireland.
 *
 * Two seller models run side by side, and the documents have to keep them
 * apart because they decide who owes a refund and who the consumer's contract
 * is with:
 *
 *   Merakí sells   - shop products, online courses, class passes and credit
 *                    packages, gift vouchers, and its own Pilates classes.
 *   Masters sell   - the beauty and wellness treatments they perform. Merakí
 *                    lists them, takes the booking and collects payment as
 *                    their agent for a commission; the service contract is
 *                    between the client and the specialist.
 *
 * The second half makes Merakí an online intermediation service, which brings
 * in the EU Platform-to-Business Regulation (2019/1150) - hence
 * DEFAULT_PROFESSIONAL_TERMS_BODY - and the marketplace disclosure duties in
 * the Consumer Rights Act 2022.
 *
 * NOTE: drafted to match the product as actually built, but this is not legal
 * advice and has not been reviewed by a solicitor. The registered company
 * details in `business.ts` must be filled in before publication.
 */

import {
  BUSINESS,
  REGISTERED_ADDRESS_LINE,
  MINIMUM_AGE,
  LEGAL_EFFECTIVE_DATE,
  DATA_PROTECTION_AUTHORITY,
  CONSUMER_BODIES,
} from './business';

const VAT_SENTENCE = BUSINESS.vatNumber
  ? `. VAT registration number ${BUSINESS.vatNumber}`
  : '. The company is not currently registered for VAT';

const IDENTITY_BLOCK = `${BUSINESS.tradingName} is a trading name of ${BUSINESS.legalName}, a company registered in ${BUSINESS.placeOfRegistration} under company number ${BUSINESS.companyNumber}, with its registered office at ${REGISTERED_ADDRESS_LINE}${VAT_SENTENCE}. Email: ${BUSINESS.email}.`;

export const DEFAULT_TOS_BODY = `Effective ${LEGAL_EFFECTIVE_DATE}

1. Who we are

${IDENTITY_BLOCK}

In these Terms, "we", "us" and "Merakí" mean that company, and "you" means the person using the Platform. The "Platform" means the Merakí website and the Merakí mobile application together.

2. Acceptance of these Terms

By creating an account or using the Platform you agree to these Terms. If you do not agree, do not use the Platform. Nothing in these Terms removes or limits the rights you have as a consumer under Irish or EU law, including the Consumer Rights Act 2022.

3. What we provide, and who you are buying from

Two different things happen on the Platform, and it matters which one you are doing, because it decides who your contract is with.

We sell you directly: retail products from the shop, online courses in the Academy, class passes and credit packages, gift vouchers, and Pilates classes at our own studio. For all of these, your contract is with Merakí and you should bring any problem to us.

Independent specialists sell you their own treatments. Beauty and wellness specialists ("Specialists") are self-employed professionals who use the Platform to offer their services. When you book a treatment with a Specialist, the contract for that treatment is between you and that Specialist. Merakí is an intermediary: we list the service, take the booking, hold your payment and pass it on to the Specialist less our commission. We are not the provider of that treatment.

Every Specialist on the Platform is a trader, not a private individual, so your full consumer rights under the Consumer Rights Act 2022 apply to what they sell you.

What we still do for a Specialist booking: we handle the payment and any refund through the Platform, we will step in and help if something goes wrong, and we will tell you how to contact the Specialist. What we cannot do is guarantee the outcome of a treatment we did not perform.

The booking screen tells you which of the two you are doing before you pay.

3a. How search results are ordered

When we show you a list of specialists or services, the order is decided by: whether they cover your location, whether they have availability for the time you asked for, the service category you searched, and how complete their profile is. Nobody pays us for a higher position, and we do not rank our own services above a Specialist's for payment.

4. Eligibility and your account

You must be at least ${MINIMUM_AGE} years old to hold an account. You agree to give accurate registration information, to keep it up to date, and to keep your password secret. You are responsible for activity under your account and must tell us promptly if you believe someone else has accessed it.

We may suspend or close an account that is used fraudulently, to abuse staff or other users, or in breach of these Terms. Where we do so we will tell you why unless we are legally prevented from doing so.

5. Bookings, classes and passes

A booking is confirmed when we send you a confirmation. Class passes, credit packages and vouchers are described on the page where you buy them, including how many sessions they cover and when they expire.

Cancellation and rescheduling terms, and how refunds work, are set out in full in our Refund and Cancellation Policy, which forms part of these Terms.

6. Health and safety

Pilates and some beauty treatments carry physical risk. Before your first Pilates session you must complete our health screening questionnaire honestly and completely, and you must tell us if your health changes. If you are pregnant, recovering from injury or surgery, or have a condition such as osteoporosis, you should take medical advice before taking part.

Our instructors are not medical practitioners and nothing provided through the Platform is medical advice, diagnosis or treatment.

7. Prices and payment

Prices are shown in euro and include Irish VAT where it applies. Payment is taken through Stripe; we do not receive or store your full card number. If a price is shown that is obviously wrong, we may cancel the order and refund you in full rather than supply at that price.

8. Courses and digital content

Online courses are licensed to you for your own personal, non-commercial use. You may not copy, download, share, resell or publicly show course material. Your access lasts for the period stated on the course page.

A course bought inside the iPhone or Android app is sold through Apple or Google, at the price their store shows in your own currency, and they issue the receipt and handle any refund. A course bought on the website is sold by us and paid through Stripe. Either way the course is attached to your Merakí account, so it is there on every device you sign in on.

9. Products

Retail products are sold subject to availability. Risk passes to you on delivery. Your statutory rights for faulty goods under the Consumer Rights Act 2022 apply in addition to anything in these Terms.

10. User content

If you upload photographs, messages or homework, you keep ownership of them. You give us permission to store and display them only as needed to run the Platform and to deliver the service you asked for. You must not upload anything unlawful, abusive, or that infringes someone else's rights. We may remove content that breaches this section.

11. Our content

The Platform's software, text, design, branding and course material belong to Merakí or its licensors and are protected by copyright and trade mark law. You may use the Platform for its intended purpose; you may not copy, scrape, reverse engineer or resell it.

12. Availability

We try to keep the Platform available but we do not promise it will be uninterrupted or error free. We may change, suspend or withdraw features, and we will give reasonable notice before withdrawing anything you have paid for.

13. Our liability

We do not limit our liability for death or personal injury caused by our negligence, for fraud, or for anything else that cannot be limited under Irish law.

Subject to that, we are not liable for losses that were not reasonably foreseeable, for business losses, or for loss caused by your failure to follow safety instructions or to disclose a relevant health condition. Where we are liable, our total liability for any claim is limited to the amount you paid us for the booking, product or course the claim relates to.

For a treatment performed by an independent Specialist, the Specialist is responsible for the treatment itself and carries their own insurance. We remain responsible for the Platform, for handling your payment and refund correctly, and for the things we say about a Specialist on their profile.

14. Complaints and dispute resolution

Please raise any complaint with us first at ${BUSINESS.supportEmail}; we aim to acknowledge within 5 working days. If we cannot resolve it, you can contact the ${CONSUMER_BODIES.ccpc.name} (${CONSUMER_BODIES.ccpc.website}), or, if you live in another EU country, ${CONSUMER_BODIES.eccIreland.name} (${CONSUMER_BODIES.eccIreland.website}).

15. Changes to these Terms

We may update these Terms. If a change materially affects your rights we will give you at least 30 days notice by email or in the app, and you may close your account before it takes effect. The effective date is shown at the top.

16. Governing law

These Terms are governed by the laws of Ireland, and the Irish courts have jurisdiction. If you are a consumer resident in another EU country, you keep the protection of the mandatory consumer law of the country you live in, and you may bring proceedings there.

17. Contact

${BUSINESS.legalName}, ${REGISTERED_ADDRESS_LINE}. Email ${BUSINESS.legalEmail}.`;

export const DEFAULT_PRIVACY_BODY = `Effective ${LEGAL_EFFECTIVE_DATE}

1. Who controls your data

${IDENTITY_BLOCK}

We are the data controller for the personal data described here. For privacy questions or to exercise your rights, contact ${BUSINESS.privacyEmail}.

2. What we collect, why, and on what legal basis

Account and identity data — name, email address, phone number, country and city, password (stored only as a hash), role, profile photo if you upload one. We need this to create and run your account. Legal basis: performance of our contract with you.

Booking and transaction data — the classes, treatments, products, passes, vouchers and courses you book or buy, when, with which practitioner, your order history, loyalty points and class credits. Legal basis: performance of our contract.

Payment data — Stripe collects and holds your card details. We receive only a payment reference, the last four digits, card brand, expiry and the outcome. We never see or store your full card number. Legal basis: performance of our contract, and legal obligation for tax records.

Health data — if you book Pilates, our health screening questionnaire asks about injuries, illnesses, disabilities, pregnancy, medication, bone health and exercise history. This is special category data under Article 9 GDPR. We process it only with your explicit consent, given when you submit the form, and only so that instructors can run sessions safely. You may withdraw consent at any time, but we will not be able to offer you Pilates sessions without it.

Consultation photographs — if you send photographs for a beauty consultation, we store them so the specialist can advise you. Where a photograph shows a skin or health condition it is also special category data and is processed on the same explicit-consent basis.

Messages — the content of chat messages and course questions you send through the Platform, so we can deliver support and teaching. Legal basis: performance of our contract.

Location — approximate location (city and coordinates) if you allow it in the mobile app, used only to pre-fill your city and time zone and to show nearby availability. Legal basis: consent, which you give through the operating system prompt and can withdraw in your device settings.

Device and notification data — a push notification token, device type and app version, so we can send booking reminders and confirmations. Legal basis: performance of our contract for service messages; consent for marketing messages.

Technical and security data — IP address, browser or device type and log timestamps, generated automatically when you use the Platform. Legal basis: our legitimate interest in keeping the Platform secure and diagnosing faults.

Marketing preferences — whether you have opted in to email or SMS marketing. Legal basis: consent. Opting out is free and always available.

We do not use advertising networks, we do not run behavioural profiling, and we do not sell personal data.

3. Analytics

Merakí does not use Google Analytics, advertising pixels, session recording or any third-party analytics SDK, on the website or in the mobile app. Usage is understood only from our own server and database logs, which we keep for security and troubleshooting.

4. Who we share data with

Supabase — database, authentication and file storage. Processor.

Stripe Payments Europe, Ltd. — payment processing and saved cards. Independent controller for fraud prevention and its own regulatory duties.

Expo and the platform push services (Apple Push Notification service and Google Firebase Cloud Messaging) — delivery of push notifications to your device.

Our email and SMS delivery provider — sending confirmations, reminders and, where you have opted in, marketing.

Professional advisers, accountants and, where required, the Revenue Commissioners or another public authority.

Independent specialists. When you book a treatment with a self-employed specialist, they receive your name, contact details and the booking details, and anything you tell them about your skin or health for that treatment. For their own client records they are a separate data controller and answer to you directly for how they use that data. They are contractually required to keep it confidential, to use it only to deliver and follow up your treatment, and not to add you to their own marketing without asking you separately.

Our own Pilates instructors see the booking details and the health screening answers they need to run your session safely. They work under our instruction, so we remain the controller for that.

5. International transfers

Some of these providers process data outside the European Economic Area. Where that happens we rely on the European Commission Standard Contractual Clauses or an adequacy decision. You can ask us for a copy of the safeguards in place.

6. How long we keep it

Account and profile data — for as long as your account is open, then deleted or anonymised within 30 days of closure.

Booking and payment records — 6 years from the end of the tax year they relate to, because Irish tax law requires it.

Health screening answers — for the duration of your membership and 7 years afterwards, to defend against personal-injury claims within the limitation period.

Consultation photographs — 2 years after the consultation, or immediately on request.

Chat messages — 2 years.

Security and access logs — 12 months.

Marketing consent records — until you opt out, plus 2 years as evidence that consent was given.

7. Your rights

Under the GDPR you have the right to access your data, correct it, have it erased, restrict or object to processing, receive it in a portable format, and withdraw any consent you have given. Withdrawing consent does not affect processing carried out before you withdrew it.

You can access and correct most of your data in Settings, and you can delete your account from Settings on the website or Edit Profile in the app. For anything else, email ${BUSINESS.privacyEmail}. We reply within one month.

You also have the right to complain to the ${DATA_PROTECTION_AUTHORITY.name}, ${DATA_PROTECTION_AUTHORITY.address} — ${DATA_PROTECTION_AUTHORITY.website}.

8. Automated decision-making

We do not make decisions about you by automated means that produce legal or similarly significant effects.

9. Children

The Platform is not for children. You must be at least ${MINIMUM_AGE} to hold an account, which is the digital age of consent in Ireland. If we learn that we hold data about someone younger without parental authorisation we will delete it.

10. Security

Access to the database is controlled by row-level security policies so that users can only reach their own records. Passwords are hashed, traffic is encrypted in transit, and card data never touches our servers. No system is perfectly secure; if a breach is likely to put your rights at risk we will notify you and the Data Protection Commission as the GDPR requires.

11. Cookies

See our Cookie Policy for the full list of cookies and local storage entries, what they do, and how to change your choice.

12. Changes

We will post any change here and update the effective date. If a change materially affects you we will tell you by email or in the app before it takes effect.

13. Contact

${BUSINESS.legalName}, ${REGISTERED_ADDRESS_LINE}. Email ${BUSINESS.privacyEmail}.`;

export const DEFAULT_COOKIE_BODY = `Effective ${LEGAL_EFFECTIVE_DATE}

1. What this covers

This policy explains the cookies and similar storage that Merakí uses on the website, and the equivalent on-device storage used by the Merakí mobile app. It is published under the European Communities (Electronic Communications Networks and Services) (Privacy and Electronic Communications) Regulations 2011 (S.I. 336/2011) and the GDPR.

2. The short version

We do not use advertising cookies, tracking pixels or third-party analytics. Almost everything we store is strictly necessary to sign you in and to remember what you put in your basket, and Irish law does not require consent for that.

The one exception is embedded video. Course lessons can contain YouTube or Vimeo players, and those players set their own cookies. We do not load them until you agree.

3. Strictly necessary — no consent required

sb-<project>-auth-token — set by Supabase, our authentication provider, when you sign in. Keeps you signed in and refreshes your session. Expires when the session expires or when you sign out.

sb-<project>-auth-token-code-verifier — a short-lived value used during sign-in and password reset to complete the secure login exchange. Deleted as soon as sign-in finishes.

meraki-theme — remembers whether you chose light or dark appearance. Stored in your browser local storage.

meraki-cart — remembers the items in your basket between page loads. Stored in your browser local storage.

meraki-cookie-consent — records the choice you made on the cookie banner, so we do not ask again. Stored for 6 months.

4. Optional — only set if you agree

YouTube (google.com, youtube.com, youtube-nocookie.com) and Vimeo (vimeo.com, player.vimeo.com) set cookies when an embedded course video loads. These can be used by those companies to recognise your browser across websites. We block the player until you choose "Accept optional cookies"; until then you see a placeholder with a button to load the video.

If you decline, you can still take the course — the player loads only when you click it, for that video, for that visit.

5. The mobile app

The app itself does not use cookies. It stores your session token in the device secure storage, and your theme choice and basket in local app storage. It contains no advertising or analytics SDK, and no advertising identifier is read.

The one exception is the course video player. When a lesson plays a YouTube or Vimeo video, the app opens that provider's player in an embedded web view, and the provider may set storage inside that view. We load YouTube through youtube-nocookie.com and ask Vimeo not to track (dnt=1), which stops the cross-site advertising cookies, and the player is loaded only when you open a lesson. Clearing the app data removes anything the player stored.

6. Changing your mind

On the website, use the "Cookie settings" link in the footer at any time to change or withdraw your choice. You can also delete cookies through your browser settings; note that deleting the strictly necessary ones will sign you out.

7. Contact

Questions about this policy: ${BUSINESS.privacyEmail}.`;

export const DEFAULT_REFUND_BODY = `Effective ${LEGAL_EFFECTIVE_DATE}

This is the single place to look for cancellations and refunds, whichever of the two things you bought. Nothing here reduces your statutory rights under the Consumer Rights Act 2022 or the EU Consumer Rights Directive.

Who owes you the money depends on what you bought:

Bought from Merakí — shop products, online courses, class passes and credit packages, gift vouchers, and Pilates classes at our studio. We owe the refund and we pay it.

Booked with an independent Specialist — a beauty or wellness treatment. The contract is with that Specialist, so the refund is theirs to give. Because we hold the payment, you claim through us in exactly the same way, we process it, and we recover it from the Specialist. You are never sent away to chase a Specialist yourself.

The cancellation windows below apply to both.

1. Classes and treatments booked for a specific time

These are bookings for a specific date and time. Under the Consumer Rights Act 2022 the 14-day cooling-off period does not apply to leisure, sport and wellbeing services booked for a specific date — so the terms below are what govern them.

Cancel more than 24 hours before the start time — full refund to your original payment method, or your class credit returned to your pass, whichever you used.

Cancel within 24 hours — 50% of the price is retained to cover the reserved slot. The remainder is refunded.

No-show without cancelling — no refund, and one class credit is used.

If we cancel — because an instructor is ill, a class does not reach its minimum, or the studio has to close — you get a full refund or, if you prefer, a transfer to another session. You will never be charged a fee for a cancellation we caused.

Late arrival — for safety we may refuse entry once a class has begun. This counts as a late cancellation.

2. Class passes and credit packages

You may cancel an unused pass within 14 days of buying it for a full refund. If you have used part of it, we refund the balance at the per-class price you actually paid, less the sessions taken.

Passes expire on the date shown on the product page. We will remind you before a pass expires. Expired credits are not refunded, but if you were prevented from using them by illness or injury, contact us and we will normally extend the pass instead.

3. Retail products

You have 14 days from the day you receive a product to change your mind, and a further 14 days to return it. Return it unused, in a resaleable condition and in its original packaging, and we refund the price plus standard outbound delivery within 14 days of getting it back. You pay the cost of the return unless the item is faulty or wrong.

Sealed cosmetics, skincare and hygiene items cannot be returned once the seal is broken, for health-protection reasons. This does not affect your rights if the item is faulty.

Faulty, damaged or misdescribed items — tell us within a reasonable time and we will repair, replace or refund. Your statutory remedies under the Consumer Rights Act 2022 apply in full, and for the first 30 days you can ask for a refund outright.

4. Online courses and other digital content

You have 14 days to change your mind about a course. However, if you ask to start straight away, you are asked to confirm that you want immediate access and that you understand you lose the right to cancel once you begin. That confirmation is recorded at checkout. If you have not opened any lesson, you keep the full 14-day right regardless.

If a course is withdrawn while you still have access, we refund the unused portion.

Courses bought inside the iPhone or Android app are sold through Apple or Google, and only they can refund them. Ask Apple at reportaproblem.apple.com, or Google through the Play Store order history. Your 14-day right still applies and they administer it. Tell us as well and we will support the request. Courses bought on the website are refunded by us directly.

5. Gift vouchers and discount codes

Gift vouchers can be refunded within 14 days of purchase if unused. Once redeemed they are treated as payment and the rules above apply to whatever was bought. Promotional discount codes have no cash value and are not refundable.

6. Memberships and recurring payments

Where a recurring payment exists, you can cancel it at any time from Settings or the Stripe billing portal. Cancelling stops the next payment; the period you have already paid for runs to its end.

7. How refunds are paid

Always to the original payment method. We start the refund within 14 days of accepting your request; your bank usually takes a further 1 to 10 working days to show it. We do not charge a fee to process a refund.

8. How to ask

Email ${BUSINESS.supportEmail} with your order or booking reference, or use Cancel on the booking in the app. You can use the model cancellation form in the Consumer Rights Act 2022 but you do not have to.

9. A problem with a treatment a Specialist performed

Tell us within a reasonable time and we will take it up with the Specialist on your behalf. If the treatment was not carried out with reasonable care and skill, your statutory remedies under the Consumer Rights Act 2022 apply to the Specialist, and we will process the refund or the redo through the Platform rather than leaving you to arrange it.

Personal injury is different and more serious: tell us immediately, and tell the Specialist. Every Specialist is required to hold their own public liability and professional indemnity insurance, and we will give you their insurer details on request.

10. If you are not happy with the outcome

Write to us at ${BUSINESS.supportEmail}. If we cannot resolve it, the ${CONSUMER_BODIES.ccpc.name} (${CONSUMER_BODIES.ccpc.website}) can advise you, and consumers resident elsewhere in the EU can contact ${CONSUMER_BODIES.eccIreland.name} (${CONSUMER_BODIES.eccIreland.website}).`;

export const DEFAULT_ACCESSIBILITY_BODY = `Effective ${LEGAL_EFFECTIVE_DATE}

1. Our commitment

Merakí wants everyone to be able to book a class, buy a product and take a course, whatever device or assistive technology they use. We aim to meet the Web Content Accessibility Guidelines version 2.2 at level AA, which is the standard referenced by EN 301 549 and by the European Accessibility Act (transposed in Ireland by S.I. 636/2023).

2. Where we currently stand

This statement is honest about work still in progress rather than claiming full conformance.

What is in place: every page has one main landmark and a skip-to-content link; colour is never the only way information is conveyed; form fields have visible labels and errors are announced to screen readers; keyboard focus is always visible; the interface respects a system "reduce motion" setting; images that carry meaning have text alternatives and decorative images are hidden from screen readers; the mobile app ships accessibility labels and roles on its controls.

Known gaps we are working on: some data-dense dashboard tables are not yet fully navigable by screen reader; a small number of older icon-only controls still need better names; the drag-to-reorder controls in the owner tools have no keyboard equivalent yet; embedded third-party video players (YouTube, Vimeo) follow their own accessibility behaviour, which we do not control.

3. If something blocks you

Email ${BUSINESS.accessibilityEmail} and tell us the page and what happened. We aim to reply within 5 working days and to offer an alternative way to complete what you were doing — including booking by email — while we fix it.

4. Enforcement

If you are not satisfied with our response you may contact the ${CONSUMER_BODIES.ccpc.name} (${CONSUMER_BODIES.ccpc.website}).`;


export const DEFAULT_PROFESSIONAL_TERMS_BODY = `Effective ${LEGAL_EFFECTIVE_DATE}

These are the terms between ${BUSINESS.tradingName} and the self-employed specialists who offer their services through the Platform. They are published because the EU Platform-to-Business Regulation (2019/1150) requires an online intermediation service to set out its terms in plain language and keep them available.

1. Who this is between

${IDENTITY_BLOCK}

"You" means the self-employed beauty or wellness specialist using the Platform to offer services. Nothing here makes you our employee, our partner, or our agent for any purpose other than the payment collection described in section 4.

2. What we do and what you do

We provide the Platform: your profile, your calendar, the booking flow, payment collection, messaging with clients, and the tools to manage your services and availability.

You provide the treatments. You decide your prices, your availability, which services you offer and which clients you accept. You are responsible for the quality and safety of what you do, for your own qualifications and insurance, and for your own tax.

3. What you must have before you take bookings

A qualification appropriate to every treatment you list, which you can produce on request.

Public liability insurance and professional indemnity insurance, in force, covering every treatment you list. We may ask for the certificate at any time.

Any licence or registration that Irish law requires for the treatments you perform.

Registration with the Revenue Commissioners as a self-employed person, and your own VAT registration once you pass the threshold.

4. Money

Clients pay through the Platform. We collect the payment as your agent and hold it on your behalf.

We deduct a commission from the price of each completed booking. Your commission rate is shown in your Earnings page and does not change without at least 30 days notice in writing.

We pay out the balance to the bank account you connect through Stripe, on the payout schedule shown in your Earnings page. Stripe's own terms apply to that account, and Stripe may hold a payout while it completes its own checks.

Where a client is refunded under the Refund and Cancellation Policy, the refund comes out of your balance. Where the cancellation was our fault, it comes out of ours.

You are responsible for your own income tax, USC, PRSI and VAT. We are not your employer and we do not deduct tax for you.

5. Your data and your clients

You can export your own bookings, earnings and client list at any time from the Platform. Ask us and we will provide it in a machine-readable file within one month.

For the clients you treat, you and Merakí are each a data controller for your own purposes. You may use a client's contact details to deliver and follow up the treatment they booked; you may not add them to your own marketing list without their separate consent, and you may not take the client list to another platform and market to it.

You must keep client health information confidential and must not disclose it to anyone outside your own practice.

6. Ranking

Where the Platform shows a list of specialists, the order is decided by location coverage, availability for the requested time, the service category searched, and profile completeness. Position cannot be bought. If we ever introduce paid placement we will say so here and label it in the interface.

7. Standards we expect

Turn up, on time, for bookings you accept. Tell the client and us as early as possible if you cannot.

Describe your services and qualifications accurately. Do not claim a certification you do not hold.

Treat clients and our staff with respect.

Do not ask a client to pay you outside the Platform for a booking made on it.

8. Suspension and termination

You may stop using the Platform at any time. Tell us, and honour the bookings you have already accepted.

We may restrict, suspend or end your access. Unless we are legally prevented, or the reason is a repeated breach or something unlawful, we will give you a statement of reasons before it takes effect, and 30 days notice where the Regulation requires it. You keep the right to respond and to ask us to reconsider.

If we suspend you, money already earned on completed bookings is still paid out.

9. Changes to these terms

We will give you at least 15 days notice of a change, in writing, as the Regulation requires - longer if the change means you need to make technical or commercial adjustments. You may end the agreement within that period if you do not accept it.

10. Complaints

Email ${BUSINESS.supportEmail} and mark it "Specialist complaint". We will acknowledge within 5 working days and give you a reasoned answer. If we cannot resolve it between us, we are willing to attempt mediation before any court proceedings.

11. Governing law

Irish law, and the Irish courts.`;
