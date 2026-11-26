import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "The Global Information Network",
  description: "Discover the Global Information Network: a private membership community focused on learning, connection and personal development.",
  alternates: { canonical: "/en", languages: { en: "/en", fa: "/fa" } },
  openGraph: { title: "The Global Information Network", description: "Learn, connect and grow with the Global Information Network.", url: "/en", siteName: "Global Information Network", locale: "en_US", type: "website", images: [{ url: "/gin/gin-social-card.png", width: 1200, height: 630, alt: "Global Information Network" }] },
  twitter: { card: "summary_large_image", title: "The Global Information Network", description: "Learn, connect and grow with the Global Information Network.", images: ["/gin/gin-social-card.png"] },
};

export default function EnglishHomePage() {
  return (
    <article className="gin-en-home">
      <h1>Welcome To The Global Information Network</h1>
      <Image className="gin-en-hero-image" src="/gin/gin-banner.webp" alt="Members of the Global Information Network gathered at a worldwide event" width={1400} height={520} priority sizes="(max-width: 768px) 100vw, 78vw" />
      <section className="gin-en-intro">
        <h2>The Global Information Network (GIN)</h2>
        <p>is a private, exclusive, “Members Only” worldwide association of individuals dedicated to achieving success in key areas of life, including:</p>
        <ul className="gin-en-emphasis-list">
          <li>Financial Independence and Wealth Creation</li>
          <li>Dynamic Vibrant Health &amp; Longevity</li>
          <li>Emotional Well-being and Inner Joy</li>
        </ul>
      </section>

      <section className="gin-en-home-video"><div className="gin-en-video-frame"><iframe src="https://player.mediadelivery.net/embed/21211/8afabd85-d7a1-43a1-824d-b467272f0951" title="Blaine 2025 video v1.mp4" loading="lazy" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div></section>

      <section className="gin-en-band gin-en-home-offer">
        <h2>Become a Member Today</h2>
        <p>GIN currently publishes a Level I membership invitation and states that prices are scheduled to increase on January 1, 2027. Confirm current availability, fees and terms with the official application provider.</p>
        <div className="gin-en-cta"><a className="gin-en-button" href="https://signup.globalinformationnetwork.com/" target="_blank" rel="noreferrer">Become a Member Today</a><span>Have questions? Speak with an active high-level Member.</span><a className="gin-en-button gin-en-button-alt" href="https://calendly.com/d/ct4v-zq9-zqw" target="_blank" rel="noreferrer">Book a Call</a></div>
      </section>

      <section className="gin-en-home-video"><h2>Members Share Their Success Stories</h2><div className="gin-en-video-frame"><iframe src="https://player.mediadelivery.net/embed/34091/f9dd38fa-5c2d-43f4-a9ad-888be6ebc0cd" title="GIN membership testimonial reel" loading="lazy" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div></section>

      <section className="gin-en-story-grid"><div><p>The reference site describes members as people interested in improving their quality of life, developing relationships and sharing knowledge across business, social and professional backgrounds. It says that the membership list is confidential and that some training and information is reserved for members.</p><p>GIN describes its subject areas as including wealth creation, investment and real-estate information, health, happiness, personal development, spiritual freedom and related learning topics. These are descriptions and claims made by the organization, not independent assessments or promises of results.</p></div><Image src="/gin/paris-intercontinental.webp" alt="GIN event at the InterContinental in Paris" width={720} height={480} sizes="(max-width: 768px) 100vw, 38vw" /></section>

      <section className="gin-en-band">
        <h2>Why Would People From All Quarters of the Earth Gather Together?</h2>
        <p>The reference page frames the question around three broad areas of interest:</p>
        <ol><li>Health and well-being</li><li>Wealth and financial satisfaction</li><li>Happiness, joy and inner peace</li></ol>
        <p>It describes GIN as a community for people seeking education, relationships, mentorship and shared experiences. Membership access and acceptance are governed by the organization&apos;s own terms.</p>
      </section>

      <section className="gin-en-home-quote"><p className="gin-en-course-kicker">A THOUGHT ON PERSONAL MASTERY</p><h2>There Was a Book Written Years Ago by James Allen</h2><h3>As a Man Thinketh</h3><blockquote>&ldquo;You can be rich and be cursed and you can be poor and be blessed; but you don&apos;t have to sacrifice one for the other.&rdquo;</blockquote><p>The reference page uses the book to introduce the idea that people learn, apply what they learn and review the results of their actions.</p></section>

      <section className="gin-en-band"><h2>Your Wish Is Your Command</h2><p>The homepage describes this audio course as an early part of GIN&apos;s training history and connects it to goal-setting, mindset and the Law of Attraction. The course is presented by GIN as a preview of its wider member library.</p></section>

      <section className="gin-en-story-grid"><div><h2>When You Analyze Success, Success Leaves Clues</h2><p>The reference site argues that private groups and communities can provide mentorship, support, information and relationships. It uses these themes to explain why members connect and share knowledge. The claims about outside organizations on the reference page are attributed to GIN and are not independently verified here.</p></div><Image src="/gin/gin-training.webp" alt="Training presentation at a GIN event" width={720} height={480} sizes="(max-width: 768px) 100vw, 38vw" /></section>

      <section className="gin-en-home-video"><h2>Watch This Exclusive Interview With the Founder of the Global Information Network</h2><div className="gin-en-video-frame"><iframe src="https://player.mediadelivery.net/embed/21211/8f898452-4366-4ac7-84da-488acdb7c481" title="Global Information Network founder interview" loading="lazy" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div></section>

      <section className="gin-en-band gin-en-home-offer"><h2>Become a Member Today</h2><p>Prices are scheduled to increase January 1, 2027, according to the current homepage.</p><div className="gin-en-cta"><a className="gin-en-button" href="https://signup.globalinformationnetwork.com/" target="_blank" rel="noreferrer">Become a Member Today</a><a className="gin-en-button gin-en-button-alt" href="https://calendly.com/d/ct4v-zq9-zqw" target="_blank" rel="noreferrer">Book a Call</a></div></section>

      <section className="gin-en-band"><h2>Andrew Carnegie and Napoleon Hill</h2><p>The reference page recounts Carnegie&apos;s commissioning of Napoleon Hill to study people it described as successful and to record principles of achievement. It connects that story with Hill&apos;s Law of Success and Think and Grow Rich, and emphasizes mentorship, shared objectives and a mastermind group. This is the historical narrative presented by GIN.</p></section>

      <section className="gin-en-band"><h2>What Are the True Secrets to Success?</h2><p>The homepage contrasts learning from books, seminars and audio programs with GIN&apos;s described library of education, networking, mentorship and support. It presents the member library as a collection from which members can choose topics relevant to their goals.</p></section>

      <section className="gin-en-band"><h2>GIN Has Experts on Its Faculty Who Specialize in Health, Relationships and Wealth Creation</h2><p>The reference homepage names health and wellness presenters, relationship educators and wealth-related faculty as part of its description of member learning. Any medical, investment, business or financial information should be independently evaluated and is not a substitute for qualified professional advice.</p><Link className="gin-en-button gin-en-button-alt" href="/en/what-we-offer">Explore What GIN Offers</Link></section>

      <section className="gin-en-story-grid"><div><h2>GIN Is Also About Creating More Adventure and Fun in Your Life</h2><p>The reference page describes GIN Adventures as travel to destinations around the world, along with local outings such as dining, hiking, rafting and ski trips. Actual events, dates, eligibility and availability are published separately.</p><Link className="gin-en-button gin-en-button-alt" href="/en/our-events">Explore GIN Events</Link></div><Image src="/gin/gin-cruise.webp" alt="Cruise ship featured in GIN group travel information" width={720} height={480} sizes="(max-width: 768px) 100vw, 38vw" /></section>

      <section className="gin-en-band"><h2>The Global Information Recipe for Success</h2><p>GIN describes its core recipe as a combination of audio learning, books, events, member relationships and opportunities for ongoing personal and professional development.</p></section>

      <section className="gin-en-band"><h2>The Global Information Network Training Material</h2><p>The homepage says that its member library includes custom audio lessons, courses, webinars and archived material on health, wealth, happiness and relationships. Its statements about the origin of training material and private societies are presented as GIN&apos;s claims, not independent verification.</p></section>

      <section className="gin-en-story-grid"><div><h2>If This Information Were Available to the General Public</h2><p>The reference homepage states that its information would be worth more than USD 5 million if sold publicly. This is GIN&apos;s own valuation claim, not an independently verified appraisal or a promise of financial return.</p></div><Image src="/gin/gin-family-reunion.jpg" alt="Members gathered at a GIN family reunion event" width={1000} height={360} sizes="(max-width: 768px) 100vw, 38vw" /></section>

      <section className="gin-en-band"><h2>Books, Events and the Member Library</h2><p>The reference page describes suggested reading, internal publications, live and virtual weekend events, seminars, local chapter meetings and an online library of audio, books and training. Access is described as dependent on membership level and event registration.</p></section>

      <section className="gin-en-story-grid"><div><h2>Members Advance Their Finances and Relationships</h2><p>The homepage describes members exchanging knowledge, contacts, mentoring and mutual support. It says members pledge to help other members first and emphasizes community relationships as an important part of the network.</p></div><Image src="/gin/gin-community.webp" alt="Members attending a GIN event" width={720} height={480} sizes="(max-width: 768px) 100vw, 38vw" /></section>

      <section className="gin-en-band"><h2>What Is Provided in the Global Information Network?</h2><p>The homepage summarizes its offer as information, education, relationships and tools that members can use in pursuit of personal goals. It also describes an online member library combined with live training and in-person events.</p><div className="gin-en-cta"><Link className="gin-en-button gin-en-button-alt" href="/en/what-we-offer">Explore the Resources</Link><Link className="gin-en-button gin-en-button-alt" href="/en/the-gin-success-system">The GIN Success System</Link></div></section>

      <section className="gin-en-band"><h2>GIN Provides a Time-Tested Success System</h2><p>The GIN Success System page organizes the program around five elements: Audio Training, Books, Events, Recognition and Relationships. Member testimonials on the reference site describe personal experiences; they should not be interpreted as guaranteed outcomes.</p><Link className="gin-en-button gin-en-button-alt" href="/en/the-gin-success-system">Explore the Success System</Link></section>

      <section className="gin-en-story-grid"><div><h2>Members Share Their Experiences</h2><p>The homepage includes testimonials from members about training, relationships, events and changes they say they experienced. These are individual accounts published by GIN and are not independently verified results.</p></div><Image src="/gin/gin-family-reunion.jpg" alt="GIN members at a group event" width={1000} height={360} sizes="(max-width: 768px) 100vw, 38vw" /></section>

      <section className="gin-en-band">
        <h2>This Is a Limited-Time Opportunity to Become a Level I Member</h2>
        <p>The reference homepage lists a one-time Level I fee of USD 1,500 and monthly dues of USD 150. It also states that applications are subject to acceptance and that pricing may change. Verify current fees and membership terms on the official application website before making a decision.</p>
        <div className="gin-en-cta"><a className="gin-en-button" href="https://signup.globalinformationnetwork.com/" target="_blank" rel="noreferrer">Become a Member Today</a><Link className="gin-en-button gin-en-button-alt" href="/en/membership-levels">View Membership Levels</Link></div>
      </section>

      <section className="gin-en-story-grid">
        <Image src="/gin/gin-cruise.webp" alt="Cruise ship featured in GIN group travel information" width={720} height={480} sizes="(max-width: 768px) 100vw, 38vw" />
        <div><h2>All New Members Are Invited to Attend a 2028 Five-Night Cruise</h2><p>The reference homepage describes a planned five-night cruise and says the ship is intended for GIN members. Dates, vessel, fares, eligibility, availability and booking terms must be confirmed in the official event information.</p><Link className="gin-en-button gin-en-button-alt" href="/en/our-events">Explore GIN Events</Link></div>
      </section>

      <section className="gin-en-band"><h2>GIN Is Not for Everyone</h2><p>The homepage says that applications may be declined and invites visitors to review the organization&apos;s offer, membership terms and personal fit before applying. Membership can be canceled under the terms published by GIN.</p></section>

      <section className="gin-en-band"><h2>GIN Will Help You Get Ahead in Life and Attain Your Dreams</h2><p>The reference page emphasizes mutual support and quotes a motto about helping other people achieve what they want. It encourages visitors to decide whether the community and its programs align with their goals.</p></section>

      <section className="gin-en-band"><h2>Right Place, Right Time</h2><p>The homepage uses this theme to discuss timing, vision and taking action, and invites visitors to consider whether applying for membership is appropriate for them.</p></section>

      <section className="gin-en-home-close"><h2>Health, Wealth and Happiness</h2><p>The closing message on the reference page emphasizes action, learning, relationships and community as part of its view of personal success. Review the public information and official terms before applying.</p><div className="gin-en-cta"><Link className="gin-en-button" href="/en/what-we-offer">Discover What GIN Offers</Link><a className="gin-en-button gin-en-button-alt" href="https://signup.globalinformationnetwork.com/" target="_blank" rel="noreferrer">Official Membership Application</a></div></section>
    </article>
  );
}
