# BoschBite Insights Adaptations

## Initial concept

BoschBite Insights was imagined as an analytics tools for student-focused restaurants and takeaways in Stellenbosch. It would use anonymised BoschCard data to help restaurant vendors understand demand, promotions, and repeat or late-night ordering, so they can make better decisions about staffing, capacity, delivery hours, and promotions.

## Revised Concepet
The adapted direction taken focuses on the restaurant vendor type. This adaption to use only the restaurant vendor type was discussed with our client and agreed upon since their features, which were adapted, more closely aligned with restaurant charcteristics then specific takeaway characteristics. The revised direction focuses on restaurant-specific demand and promotion insights. 
In terms of the UI design, the logo and colour palette changed to align with the requests of the clients, and the side navigation  organised into **Insights** and **Admin Tools**.


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

The original features were based on the synthetic data that our clients provided. This data included a calendar table and a promotional windows table. The calendar table, associated with university dates and public holidays, was then included in the ERD prescribed by BoschCard. We started by developing the basic application, setting up the back end and front end with a basic sign-in and dashboard.

It became clear that our clients would not be able to provide a promotional windows table, and that there woudl be no baseline data as all transactions were discount values. We had to adapt their initial features since they heavily relied on comparison between baseline and discount data. 

Instead, the promotional windows table was derived using calculations based on the transaction data. We identified two types of promotional windows: ongoing and weekly. Ongoing promotions run over consecutive days, whereas weekly promotions run on the same weekday every week, for instance a burger special every Monday.

The initial promotion analysis feature evolved into promotional effectiveness which tracks customer reach and loyalty. This feature was then intrgreated into the Leaderboard feature where the leaderbaord feature evolved from thier annonymised peer benchmarking. The leaderboard ranks vendors by promotional effectiveness, efficiency and location. We included the leaderboard feature to make use of more diverse data from BoschCard (such as location) instead of simply focussing on transaction data. The leaderbaord also provided insight into how a vendor could improve as well as promoting competition between vendors. 

The business dashboard was adapted from individual vendor sales analytics to a restaurant-wide market dashboard that showed broad market share. It therefore included features that were broadly based on the market, such as total market share, total orders, active promotions across the entire market and more. This shift enabled for a greater use of diverse data provided by BoachCard, rather than using internal trasnaction data for each vendor which they already had at their disposal. 

The academic calendar was retained to highlight periods such as exams and recess that may affect student activity, and to show promotional windows. Our clients decided to remove the social calendar and to use only the calendar data provided by BoschCard. 

We initially removed demand forecasting as a feature, due to concerns about the prediction accuracy. However, during final development, after providing the client with the minimal viable product, they requested us to look further into this feature. Therefore a beta version of the feature was developed and will be presented to the client. However, the concerns around prediction accuracy still reamin, therefore, we included a "Forecast accuracy" KPI which presents the accuracy of the previous promotions forecasting and therefore warns the user against possible accuracy concerns. 

After discussing the capacity and staffing planner with our clients, and based on their being no data relating to staffing from BoschCard as well as out clients being unable to provide staffing schedules, we decided that the feature would get removed. Instead, the feature could be included implicitly through the demand forecasting feature.

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

