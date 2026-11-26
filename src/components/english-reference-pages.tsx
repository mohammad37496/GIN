import Image from "next/image";
import Link from "next/link";

function ReferenceImages({ items }: { items: Array<{ src: string; alt: string; caption?: string }> }) {
  return <div className={`gin-en-reference-images gin-en-reference-images-${items.length}`}>{items.map((item) => <figure key={item.src}><Image src={item.src} alt={item.alt} width={900} height={420} sizes="(max-width: 768px) 100vw, 28vw" />{item.caption && <figcaption>{item.caption}</figcaption>}</figure>)}</div>;
}

function MembershipCta({ label = "Apply For Membership" }: { label?: string }) {
  return <p className="gin-en-reference-cta"><a className="gin-en-button" href="https://signup.globalinformationnetwork.com/" target="_blank" rel="noreferrer">{label}</a></p>;
}

export function EnglishAboutUsContent() {
  return <div className="gin-en-reference-copy">
    <ReferenceImages items={[{ src: "/gin/reference-pages/about-adventure.webp", alt: "GIN members enjoying an outdoor group event", caption: "Adventure & Fun" }, { src: "/gin/reference-pages/about-friendships.webp", alt: "GIN members celebrating together", caption: "Friendships" }]} />
    <p>The Global Information Network describes itself as an exclusive, member-only association focused on four broad goals:</p>
    <ul><li>Financial independence</li><li>Wealth creation</li><li>Dynamic health</li><li>Emotional well-being</li></ul>
    <p>GIN says its members, associates and faculty span more than 150 countries and come from a wide range of professional, social and economic backgrounds. The organization presents the club as a community for people who want to learn, build relationships and pursue goals beyond financial success alone.</p>
    <p>The site describes a library of training and tools related to wealth, health, longevity, personal development and spiritual interests. It also emphasizes long-term relationships, mutual support and the exchange of business and personal expertise between members.</p>
    <p>GIN says that its members and faculty include accomplished people from business, finance, the arts, science, education, spirituality and other fields. It states that member identities and its membership directory remain private unless individuals authorize disclosure.</p>
    <p>The areas of information listed by GIN include:</p>
    <ul><li>Health, longevity and anti-aging topics</li><li>Happiness, emotional well-being and inner peace</li><li>Mindset, goal-setting and the Law of Attraction</li><li>Investing and trading across different asset classes</li><li>International real-estate information</li><li>Asset protection, banking structures and trusts</li><li>Health technologies and natural approaches</li><li>Self-realization, personal development and spiritual freedom</li></ul>
    <p>These courses and materials are described as member-only resources. GIN states that membership is by invitation and that not every application is accepted.</p>
    <MembershipCta label="Become a Member" />
  </div>;
}

export function EnglishWhoWeAreContent() {
  return <div className="gin-en-reference-copy">
    <p>The Global Information Network describes itself as a private membership organization, club, society and association.</p>
    <ReferenceImages items={[{ src: "/gin/reference-pages/who-wealth.webp", alt: "Large GIN gathering in a conference venue", caption: "Wealth Creation" }, { src: "/gin/reference-pages/who-happiness.webp", alt: "GIN gala dinner event", caption: "Happiness, Joy & Bliss" }, { src: "/gin/reference-pages/who-health.webp", alt: "GIN members attending a large event", caption: "Health, Longevity & Youth" }]} />
    <p>The page attributes the organization&apos;s conception to people with experience in private clubs and international institutions. It says the individuals who organized the GIN Council remain anonymous. These descriptions and affiliations are claims made by GIN and are not independently verified by this portal.</p>
    <p>GIN presents its purpose as making learning and connections available to people who may not qualify for other private groups. It says members can access training, ideas and relationships that the organization describes as having previously been limited to exclusive circles.</p>
    <p>The organization&apos;s published creed centers on broad themes including:</p>
    <ul><li>Access to knowledge and the freedom to learn</li><li>The right to pursue happiness and personal goals</li><li>Health, well-being and personal development</li><li>Privacy and freedom of expression</li><li>Equal human dignity and respect for life</li><li>Opportunity to prosper across family, career, financial and personal areas</li></ul>
    <p>GIN says the people who encouraged its formation include individuals it describes as business leaders, public figures, scientists and former government leaders. It also states that these individuals remain anonymous and do not have an official public association with the organization.</p>
    <p>The page describes a goal of sharing information and encouraging greater personal responsibility, empowerment, compassion, prosperity and peace. These are the organization&apos;s stated aspirations rather than independently established outcomes.</p>
    <p><strong>The origin of the club name</strong></p>
    <p>GIN says its unspoken club name is based on two ancient Latin words, one associated with elevation and nobility and the other with the heavenly or celestial. The page connects those meanings with its own language about energy, symbolism and personal development.</p>
    <p>GIN states that it was formally established as a legal entity in 2009 and describes its broader historical influences as extending much further back in time.</p>
    <MembershipCta />
  </div>;
}

export function EnglishWhatWeOfferContent() {
  return <div className="gin-en-reference-copy gin-en-what-we-offer">
    <ReferenceImages items={[{ src: "/gin/gin-family-reunion.jpg", alt: "GIN group gathering used with the Dynamic Health topic", caption: "Dynamic Health" }, { src: "/gin/paris-intercontinental.webp", alt: "GIN event at the InterContinental Paris", caption: "Financial Independence" }, { src: "/gin/reference-pages/what-enlightenment.jpg", alt: "Library interior used with the enlightenment topic", caption: "Enlightenment – Self Realization" }]} />
    <p>GIN describes its offer as a collection of private worldwide benefits intended to support members&apos; personal goals and development. It says that many benefits are confidential and become available as a member qualifies for each level.</p>
    <p><strong>Core benefits</strong></p>
    <ul><li>Member-only success training, including the Success Mastery and Science of Personal Mastery courses</li><li>Subject-specific learning across key areas of life</li><li>Major weekend events, seminars and conferences, online and in person</li><li>Workshops, awards events, symposiums, expos and retreats</li><li>Adventure outings, lectures and local chapter meetings</li></ul>
    <p>GIN says its core courses combine video, audio and written lessons with live seminars and workshops for members.</p>
    <p><strong>Core member training for total success</strong></p>
    <ul><li>Success Mastery Course: Levels 1–12 in audio and video formats</li><li>Science of Personal Mastery: 100 written lessons</li></ul>
    <p><strong>Subject-specific training</strong></p>
    <ol><li><Link href="/en/wealth-creation">Wealth creation, income ideas and financial abundance</Link></li><li><Link href="/en/dynamic-health">Dynamic health, natural health and longevity</Link></li><li><Link href="/en/happiness">Happiness, emotional well-being and inner peace</Link></li><li><Link href="/en/personal-mastery">Self-realization, consciousness and spiritual freedom</Link></li><li>Historical and philosophical topics about private societies</li><li>Motivation and inspiration</li><li>Relationships and communication</li><li>Life skills, etiquette and public speaking</li><li>Business skills, marketing and raising capital</li><li>International living and global financial information</li><li>Specialty training and youth development</li><li>Fitness and self-defense</li></ol>
    <p><strong>Events and meetings</strong></p>
    <ul><li>Four Major Weekend events each year, live and virtual</li><li>Seminars and rallies in both formats</li><li>Local chapter meetings around the world</li><li>Conferences, symposiums, lectures, workshops, awards events, banquets and expos</li><li>GIN Adventures and retreats</li></ul>
    <p><strong>Other benefits</strong></p>
    <ul><li>Worldwide contacts and connections</li><li>Private updates and communications</li><li>Member bonuses, perks, VIP access and concierge services</li><li>Recommended books, audio and video resources</li></ul>
    <p>GIN says some additional benefits are disclosed only after acceptance at the relevant membership level.</p>
    <p id="money-making-opportunities"><strong>Income and business information</strong></p>
    <p>The organization says it provides educational information about methods people use to generate income in different markets. These are descriptions of training topics, not financial advice, independently verified returns or promises of income.</p>
    <p><strong>Loans and credit information</strong></p>
    <p>GIN lists information about credit, loans and financing structures as a member topic. This site does not arrange or guarantee financing; members should assess providers, terms and risks independently.</p>
    <p id="worldwide-contacts"><strong>Worldwide contacts</strong></p>
    <p>The page describes a global network where members exchange ideas, perspectives and firsthand information and build professional and personal relationships.</p>
    <p><strong>Global health information</strong></p>
    <p>GIN says its library covers medical discoveries, treatment approaches, natural health topics, anti-aging and longevity. These descriptions are not medical guidance or verified treatment claims.</p>
    <p><strong>Attraction and mindset</strong></p>
    <p>The Law of Attraction is listed among the subjects taught through the Success Mastery and Science of Personal Mastery courses.</p>
    <p><strong>Private society topics</strong></p>
    <p>The organization says some training discusses historical private groups and their philosophies. Its statements about those groups are GIN&apos;s own claims.</p>
    <p><strong>Path to self-realization</strong></p>
    <p>GIN describes lessons on happiness, awareness, consciousness, inner peace and spiritual development.</p>
    <p id="mentoring"><strong>Mentoring</strong></p>
    <p>The page says members may seek or provide mentoring and that the organization offers mentor training. Availability depends on membership status and program arrangements.</p>
    <p id="roundtables"><strong>Member roundtables</strong></p>
    <p>GIN describes roundtables as discussions where members can bring a personal or business challenge to a group of experienced members for questions, ideas and encouragement. This is peer support, not a substitute for qualified professional advice.</p>
    <p><strong>How information is shared</strong></p>
    <ul><li>Private member website areas</li><li>Audio and video training</li><li>Books, manuscripts and written reports</li><li>Live and archived online webinars</li><li>Private email and telephone communications</li><li>In-person workshops and seminars</li><li>One-to-one mentoring</li></ul>
    <p><strong>Who presents the material?</strong></p>
    <p>GIN says its training is delivered by communicators and faculty members who present information to members. Statements about presenter backgrounds and affiliations are those of the organization.</p>
    <MembershipCta />
  </div>;
}

export function EnglishMemberBenefitsContent() {
  return <div className="gin-en-reference-copy">
    <h3>What do you receive when you become a Member?</h3>
    <p>The public page lists a one-time membership fee of $1,500 and ongoing monthly dues of $150, and says members may cancel at any time. Confirm current fees and terms before applying.</p>
    <p>GIN says accepted applicants receive a complimentary ticket to an upcoming three-day Major Weekend event, which it values at more than $20,000, with live and virtual attendance options.</p>
    <ul><li>A weekly five-to-ten-minute audio update from a managing director or senior member</li><li>Private communications by text, telephone, email or postal mail when the organization considers information time-sensitive</li></ul>
    <p><strong>Core success training</strong></p>
    <p>The member website includes access to the Success Mastery Course. GIN describes “Your Wish Is Your Command” as a fourteen-hour audio course and lists more than thirty hours of additional core training, with stated values published by the organization.</p>
    <p>Other audio and video material described on the page includes an overview of the GIN system and a course about ten steps toward personal goals.</p>
    <p><strong>Additional member access</strong></p>
    <ul><li>Local chapter meetings, in person and virtual</li><li>Major Weekend events, with tickets required after the first complimentary event</li><li>Quarterly virtual seminars and rallies</li><li>Weekly member-development audio</li></ul>
    <p>The page says additional benefits are disclosed privately to members after they join.</p>
    <MembershipCta />
  </div>;
}

export function EnglishAssociateBenefitsContent() {
  return <div className="gin-en-reference-copy">
    <p>GIN describes Associate membership as an entry level with training, event access and networking benefits. The page states that the organization adds new benefits over time; current access is subject to membership terms.</p>
    <Image className="gin-en-reference-portrait" src="/gin/reference-pages/associate-level-graphic.jpeg" alt="Associate membership training and event benefits" width={480} height={1000} />
    <Image className="gin-en-reference-banner" src="/gin/reference-pages/associate-benefits.webp" alt="Associate membership benefit summary" width={1000} height={300} />
    <p><strong>1. GIN Training</strong></p>
    <p>Associate members are described as receiving access to introductory core training, including the Your Wish Is Your Command course, the first 24 Success Mastery lessons, leadership material and selected lessons from the member library.</p>
    <p><strong>2. GIN Events</strong></p>
    <p>The page emphasizes networking and lists in-person and virtual chapter meetings, four Major Events each year with one complimentary ticket, member pricing for additional tickets and a weekly $100 listening giveaway described by GIN.</p>
    <p><strong>3. GIN Store</strong></p>
    <p>Associate members are directed to an online store that the organization describes as carrying stationery, wellness products and water-filtration items.</p>
    <Image className="gin-en-reference-banner" src="/gin/reference-pages/associate-why-upgrade.webp" alt="Why upgrade to Level I membership" width={1000} height={150} />
    <h3>Level I: How to Manifest Your Own Desires</h3>
    <p>The Level I description adds more core training, subject-specific material, event access and community features to the Associate benefits.</p>
    <ul><li>Level I lessons from the Science of Personal Mastery and Success Mastery courses</li><li>Subject-specific learning on financial abundance, motivation, mindset, health, business and relationships</li><li>Four complimentary seminar and rally tickets each year, GIN Adventures and access to previous event recordings</li><li>Access to a virtual community and member directory</li></ul>
    <p>Course titles and faculty listed by GIN are part of its published curriculum; access and availability can change.</p>
    <p>To upgrade, the reference page directs members to the official access page.</p>
    <p className="gin-en-reference-cta"><a className="gin-en-button" href="https://globalinformationnetwork.com/access/" target="_blank" rel="noreferrer">Upgrade To Level I</a></p>
    <h3>Level I Member Testimonials</h3>
    <div className="gin-en-testimonials">
      <figure><Image src="/gin/reference-pages/associate-testimonial-gabor.jpg" alt="Level I member testimonial portrait" width={150} height={180} /><figcaption>Gabor V — shares his experience with GIN training and business.</figcaption></figure>
      <figure><Image src="/gin/reference-pages/associate-testimonial-maurice.webp" alt="Level I member testimonial portrait" width={150} height={180} /><figcaption>Maurice I — describes renewed motivation and personal goals.</figcaption></figure>
      <figure><Image src="/gin/reference-pages/associate-testimonial-andrew.webp" alt="Level I member testimonial portrait" width={150} height={180} /><figcaption>Andrew G — describes returning to the training during a difficult period.</figcaption></figure>
    </div>
  </div>;
}

export function EnglishOurTrainingContent() {
  return <div className="gin-en-reference-copy">
    <p>GIN describes hundreds of hours of courses on mindset, personal development and goal-setting, intended to give members access to a broad training library.</p>
    <p>Its core library is described as including:</p>
    <ul><li>The Success Mastery Course, with audio and video lessons across twelve levels</li><li>The Science of Personal Mastery Course, with one hundred written lessons</li></ul>
    <Image className="gin-en-reference-single-image" src="/gin/reference-pages/our-training.webp" alt="Members attending a GIN training session" width={1000} height={420} sizes="(max-width: 768px) 100vw, 70vw" />
    <h2>The Three Benefits GIN Highlights in Its Training</h2>
    <p><strong>Exclusive and confidential content</strong></p>
    <p>GIN says its training library is reserved for active members and is not available to the general public.</p>
    <p><strong>A distinctive learning approach</strong></p>
    <p>The page describes a club-specific approach that it associates with spiritual imprinting, energy and personal development. These are GIN&apos;s own descriptions.</p>
    <p><strong>A broad learning experience</strong></p>
    <p>The organization says its library combines audio, video, written lessons and in-person experiences, and is intended to help members explore personal and professional goals.</p>
    <h2>What Members Can Explore Through GIN Training</h2>
    <p><strong>Depth and breadth of content</strong></p>
    <p>GIN says its core training extends beyond common success topics and covers a wide range of personal and professional development subjects.</p>
    <p><strong>Strategies and techniques</strong></p>
    <p>The Success Mastery and Science of Personal Mastery courses are described as presenting methods and ideas members can study and apply. Outcomes are not guaranteed.</p>
    <p><strong>Ongoing development</strong></p>
    <p>The page says that new material is added and existing content refined each quarter, providing continuing access to audio, video and written resources.</p>
    <h2>Join Us on Your Path to Mastery</h2>
    <p>GIN invites qualified applicants to join and access its member training library.</p>
    <MembershipCta label="Join Us Today" />
  </div>;
}

export function EnglishEventsContent() {
  return <div className="gin-en-reference-copy gin-en-events-content">
    <p>GIN describes its member events as live, in-person and online gatherings held around the world.</p>
    <div className="gin-en-video-frame"><iframe src="https://iframe.mediadelivery.net/embed/34091/9d916f6f-12a5-4580-a11e-b0681c5f14bb?autoplay=false&loop=false&muted=false&preload=false&responsive=true" title="GIN Major Weekend event video" loading="lazy" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>
    <p><strong>GIN events include:</strong></p>
    <ul><li>Four Major Weekend events each year, including an annual five-night Caribbean cruise</li><li>Four one-day seminars and awards rallies each year</li><li>Workshops and webinars</li><li>Expos and success-course events</li><li>GIN Adventures and local chapter meetings</li><li>Symposiums and global conventions</li></ul>
    <div className="gin-en-video-frame"><iframe src="https://iframe.mediadelivery.net/embed/34091/3d3338c0-56f8-4db2-b400-e6492cecf320?autoplay=false&loop=false&muted=false&preload=false&responsive=true" title="GIN member seminar and awards rally" loading="lazy" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>
    <p><strong>Events are presented as opportunities for members to learn about:</strong></p>
    <ul><li>Wealth creation and business</li><li>Health and well-being</li><li>Inner joy, peace and happiness</li></ul>
    <div className="gin-en-video-frame"><iframe src="https://iframe.mediadelivery.net/embed/34091/79e130ef-1ef9-40b4-b19f-5850aebfeced?autoplay=false&loop=false&muted=false&preload=false&responsive=true" title="GIN global networking event" loading="lazy" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>
    <p><strong>Subjects listed for member events include:</strong></p>
    <ul><li>Business success and personal development</li><li>Personal, romantic and business relationships</li><li>Cryptocurrency and investing</li><li>Real estate and international banking</li><li>Asset protection and other wealth, health and happiness topics</li></ul>
    <MembershipCta />
    <ReferenceImages items={[{ src: "/gin/reference-pages/events-networking.webp", alt: "GIN members networking at a hotel event" }, { src: "/gin/reference-pages/events-training-ballroom.jpg", alt: "GIN training and awards event in a ballroom" }]} />
  </div>;
}

export function EnglishPersonalMasteryContent() {
  return <div className="gin-en-reference-copy gin-en-personal-mastery-content">
    <p>The reference page contrasts a brief emotional reaction with a much longer one and uses that comparison to introduce self-awareness and personal mastery.</p>
    <p>It describes personal mastery as learning to guide thoughts and emotions and taking greater responsibility for one&apos;s experience and choices. Its language about vibration and attraction is the organization&apos;s philosophical framing, not a scientific or clinical claim.</p>
    <p>Much Love,</p>
    <Image className="gin-en-reference-single-image" src="/gin/levels-footer.png" alt="Personal mastery page closing image" width={1000} height={280} sizes="(max-width: 768px) 100vw, 70vw" />
  </div>;
}

export function EnglishClubhousesContent() {
  return <div className="gin-en-reference-copy gin-en-clubhouses-content">
    <Image className="gin-en-reference-single-image" src="/gin/reference-pages/clubhouse-2024.webp" alt="Property shown as a GIN clubhouse concept" width={1200} height={680} sizes="(max-width: 768px) 100vw, 78vw" />
    <p>GIN says it is developing local Clubhouses in areas where groups of members live. It expects the network to grow as membership expands.</p>
    <p>The proposed spaces are intended to be private and available exclusively to members.</p>
    <ReferenceImages items={[{ src: "/gin/reference-pages/clubhouse-castle.jpg", alt: "Historic property shown as a clubhouse example" }, { src: "/gin/reference-pages/clubhouse-manor.jpg", alt: "Manor property shown as a clubhouse example" }]} />
    <p>GIN describes possible uses including local chapter meetings, seminars, course training, workshops, roundtables, conferences, virtual events, social gatherings and advanced member training.</p>
    <p>The page also presents Clubhouses as places for recreation, friendship and informal time with other members. The locations shown are illustrative; the page does not provide a public booking directory or confirmed opening dates.</p>
    <Image className="gin-en-reference-single-image" src="/gin/reference-pages/clubhouse-paris.webp" alt="Grand hotel interior used as a GIN clubhouse illustration" width={1200} height={680} sizes="(max-width: 768px) 100vw, 78vw" />
  </div>;
}
