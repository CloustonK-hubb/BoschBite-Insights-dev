# BoschBite Insights Adaptations

## Initial concept

BoschBite Insights was imagined as an analytics tools for student-focused restaurants and takeaways in Stellenbosch. It would use anonymised BoschCard data to help restaurant vendors understand demand, promotions, and repeat or late-night ordering, so they can make better decisions about staffing, capacity, delivery hours, and promotions.

## Revised Concepet
The product direction taken focuses on the restaurant vendor type. The revised direction focuses on restaurant-specific demand and promotion insights. The logo and colour palette have changed, and the side navigation is organised into **Insights** and **Admin Tools**.


## Features

### Initial Features

The original six feature areas were:
1. **Promotion effectiveness/ analysis** - examine discount activity across the day and identify when promotions reach customers.
2. **Anonymised peer benchmarking** - compare a vendor with market averages without naming competitors.
3. **Business dashboard** - show mealtime performance, daily revenue, and average order value.
4. **Academic and social calendar planning** - account for recess, exams, events, concerts, and other changes in student activity.
5. **Demand analysis and forecasting** - project hourly demand for the next 24 hours using transaction history.
6. **Capacity/ staffing planner** - compare forecast demand with available staff and meal-preparation status.

### Revised Features

The original features were based on the synthetic data that our clients provided. This data included a calendar table and a promotional windows table, which were to be added to the ERD prescribed by BoschCard. We started by developing the basic application, setting up the back end and front end with a basic sign-in and dashboard.

Once it became clear that our clients would not be able to provide a promotional windows table, and that all transactions were discounted, meaning there were no baseline transactions, we had to adapt their initial features. Instead, we used calculations on the transaction data to derive the promotional windows. We identified two types of promotional windows: ongoing and weekly. Ongoing promotions run over consecutive days, whereas weekly promotions run on the same weekday every week, for instance a burger special every Monday.

The initial promotion analysis feature evolved into promotion effectiveness tracking based on customer reach and loyalty, with promotion efficiency and location also contributing to each vendor’s overall score. Anonymised peer benchmarking became an anonymous leaderboard that ranks vendors by promotion reach, promotion loyalty, efficiency and location.

The business dashboard shifted from individual vendor sales analytics to a restaurant market dashboard showing market share, a linked leaderboard position, active promotion discounts and market concentration, because detailed everyday transaction data was not available for each vendor. Showing market statistics also provides more value to individual vendors, because it gives them insights beyond their own data, which they already have access to.

The academic calendar was retained to highlight periods such as exams and recess that may affect student activity, and to show promotional windows. Our clients decided to remove the social calendar and to use only the calendar data provided by BoschCard. Demand forecasting was carried forward as a beta feature.

After discussing the capacity and staffing planner with our clients, and since they were not able to provide staffing schedules, we decided that the data presented in the new features will be used by individual vendor admins and managers to make their own capacity and staffing decisions. 

## Users and Access

### Initial Roles:

The initial roles were Admin, Manager and Staff.
- **Admin:** Managed users and roles, maintained the academic and social calendar, managed vendor settings, and had full access.
- **Manager:** Viewed business analytics, applied or dismissed recommendations, and exported reports.
- **Staff:** Used the demand forecast and capacity/staffing planner to prepare for shifts, without access to revenue, benchmarking, or promotion performance data.

### Revised Users and Access

The final user roles are **BoschBite Admin**, **Vendor Admin** and **Vendor Manager**.
- **BoschBite Admin:** Full site access, including features, BoschCard and BoschBite data tables, and user profiles. Can verify, deny, remove, and reinstate profiles, and respond to help requests and mark them resolved.
- **Vendor Admin:** Access to their own vendor's data. Can view company user status, change team members' roles, edit company information, and submit help requests.
- **Vendor Manager:** View only access to their own vendor's data and export, and can submit help requests.

All users can edit their own profiles.

