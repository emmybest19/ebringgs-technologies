Recommended hybrid
Have both paths on your services page:


Services page
├── Productized packages (instant buy) ──→ Detail page → "Purchase" → Checkout
└── "Need something custom?" ──────────→ Inquiry form → Admin scopes → Quote
A small "Not seeing what you need? Request a custom quote" link at the bottom of the services list catches the work that doesn't fit a package.

The post-purchase step you're missing
Your proposed flow ends at "make payment" — but the moment payment succeeds, the client needs to give you info to start the work. Otherwise you're sitting there going "what colors do they want?"

So:


Pay → Success page → Auto-creates Project (status: awaiting_brief)
   → Redirects client to a brief/intake form for THIS specific service
   → Once submitted → status: in_progress → admin gets notified to start
   → Client sees project in /client/projects with milestones
The intake form is service-specific (logo design needs different inputs than a UX audit). This replaces the back-and-forth that admin review used to handle.

Concrete UX flow I'd build

1. Client logs in → /client/services
2. Sees grid of services (just the productized ones)
3. Clicks "Landing Page Design" → /services/landing-page-design
4. Detail page shows scope/timeline/refund/FAQ + "Purchase ₦150,000" button
5. Click → /checkout?type=service&id=landing-page-design
6. Pays via Paystack
7. /payment/success → "Payment confirmed. Tell us about your project →"
8. Service-specific intake form (brand colors, content, references, etc.)
9. Submit → /client/projects/:id with status "Brief received — kicking off Monday"
10. Admin gets email: "New project ready to start"
My honest verdict
Do it, but only for services you can productize. Spend a day writing crystal-clear scopes for 3-5 of your most common service offerings, ship those as self-serve, and keep "Request custom quote" as a fallback for everything else. Don't try to productize everything overnight — start with the ones you've delivered enough times to have a fixed playbook.

This is the model that scales. Admin review doesn't.

Want me to plan out the implementation — the route changes, the post-purchase intake form, and the service detail page template?