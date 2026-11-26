import Image from "next/image";
import { ginMembershipLevels } from "@/lib/gin-membership-levels";

export default function EnglishMembershipLevelsTable() {
  return <div className="gin-en-membership-table-wrap" role="region" aria-label="GIN membership levels table" tabIndex={0}>
    <table className="gin-en-membership-table">
      <thead><tr><th>Membership Levels</th><th>Qualifications</th><th>Benefits</th><th>Cash Bonuses “Perks” Rewards</th></tr></thead>
      <tbody>{ginMembershipLevels.map((item) => <tr key={item.level}>
        <th scope="row"><div className="gin-en-level-cell"><Image src={`/gin/membership-levels/${item.image}`} alt={item.alt} width={68} height={68} /> <span>{item.title}</span></div></th>
        <td>{item.qualifications}</td><td>{item.benefits}</td><td>{item.cashBonuses}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}
