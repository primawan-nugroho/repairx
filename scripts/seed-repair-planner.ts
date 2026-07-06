import path from "node:path";
import { config } from "dotenv";
import { forceIpv4 } from "@/lib/force-ipv4";

forceIpv4();
config({ path: path.resolve(__dirname, "..", ".env.local") });

// Tab-separated, matching the columns:
// Engine/APU, Customer, Type, SN, EO, Workscope, Induction date, RPC-1, RPC-2,
// Gate4Status, StatusProject, Remark
const RAW = `Engine\tVIV INT.\tCFM56-3\t720886\tHardhani\tOverhaul 60\t1-Oct-20\tDENNY\tSIGIT\tCLOSED\tCLOSED\t
Engine\tTILINK / ICBC\tCFM56-5B\t569401\tAfrizal\tOverhaul 60\t23-Nov-20\tFIRMAN\tDENNY\tCLOSED\tCLOSED\t
Engine\tFBA\tCFM56-7B\t888981\tJaka\tOverhaul90\t6-Dec-21\tFIRMAN\tSIGIT\tINPROGRESS\tWIP\t
APU\tCITILINK\tGTCP131-9A\tP-35337C\tYuli\tMediumRepair\t28-Apr-22\tSIGIT\tADING\tINPROGRESS\tWIP\t
Engine\tGRIFFON\tCFM56-7B\t658865\tJaka\tOverhaul 90\t18-Aug-22\tDENNY\tSIGIT\tCLOSED\tCLOSED\t
Engine\tGRIFFON\tCFM56-7B\t658914\tHardhani\tOverhaul90\t31-Aug-22\tFIRMAN\tDENNY\tINPROGRESS\tWIP\t
Engine\tGRIFFON\tCFM56-7B\t657736\tKikin\tOverhaul90\t7-Sep-22\tFIRMAN\tSIGIT\tINPROGRESS\tWIP\t
Engine\tAEROEAGLE\tCFM56-3\t722364\tDony\tOverhaul 60\t5-Oct-22\tSIGIT\tFIRMAN\tCLOSED\tCLOSED\t
APU\tGMF\tGTCP131-9A\tP-3130\tYuli\tMedium\t14-Mar-24\tFIRMAN\tADING\tINPROGRESS\tWIP\t
Engine\tACN\tCFM56-3\t721396\tSyafril\tMinimum45\t30-Apr-24\tSIGIT\tDENNY\tINPROGRESS\tWIP\t
APU\tCITILINK\tGTCP131-9A\tP-5264\tGanjar\tOverhaul\t6-May-24\tDENNY\tADING\tCLOSED\tCLOSED\t
Engine\tAirasia\tCFM56-5B\t569764\tAfrizal\tMinimum 21\t27-May-24\tDENNY\tFIRMAN\tCLOSED\tCLOSED\t
APU\tGMF\tGTCP131-9B\tP-6590\tYanqo\tMedium\t10-Jun-24\tSIGIT\tADING\tINPROGRESS\tWIP\t
Engine\tAFD\tCFM56-3\t856123\tAditya\tMinimum 45\t5-Aug-24\tFIRMAN\tSIGIT\tCLOSED\tCLOSED\t
Engine\tGARUDA\tCFM56-7B\t660754\tAfrizal\tRepair LPT stg4\t15-Aug-24\tSIGIT\tDENNY\tCLOSED\tCLOSED\t
APU\tGARUDA\tGTCP131-9B\tP-9320\tGanjar\tOverhaul\t26-Aug-24\tFIRMAN\tADING\tCLOSED\tCLOSED\t
Engine\tGARUDA\tCFM56-7B\t804662\tHardhani\tOverhaul 150\t2-Sep-24\tDENNY\tFIRMAN\tCLOSED\tCLOSED\t
APU\tGARUDA\tGTCP131-9B\tP-10717\tYanqo\tOverhaul\t23-Oct-24\tFIRMAN\tADING\tCLOSED\tCLOSED\t
Engine\tGARUDA\tCFM56-7B\t804661\tDony\tOverhaul 150\t6-Nov-24\tSIGIT\tDENNY\tCLOSED\tCLOSED\t
Engine\tGARUDA\tGE90\t907348\tAditya\tSplit & Mating\t25-Nov-24\t-\t-\tCLOSED\tCLOSED\t
Engine\tWWTAI\tCFM56-5B\t575530\tAditya\tAft seal replace\t9-Dec-24\tFIRMAN\tSIGIT\tCLOSED\tCLOSED\t
Engine\tGARUDA\tCFM56-7B\t960107\tHardhani\tOverhaul 150\t11-Dec-24\tFIRMAN\tSIGIT\tCLOSED\tCLOSED\t
Engine\tGARUDA\tCFM56-7B\t960748\tDony\tOverhaul 150\t17-Dec-24\tDENNY\tFIRMAN\tCLOSED\tCLOSED\t
Engine\tEASTAR\tCFM56-7B\t805211\tKikin\tMedium 60\t23-Dec-24\tSIGIT\tDENNY\tCLOSED\tCLOSED\t
Engine\tGARUDA\tCFM56-7B\t962859\tDhimas\tQT HPT Blade 14\t24-Dec-24\tSIGIT\tFIRMAN\tCLOSED\tCLOSED\t
Engine\tGARUDA\tCFM56-7B\t960366\tKikin\tOverhaul150\t30-Dec-24\tSIGIT\tDENNY\tINPROGRESS\tWIP\t
APU\tGARUDA\tGTCP131-9B\tP-9217\tYuli\tOverhaul\t2-Jan-25\tDENNY\tADING\tCLOSED\tCLOSED\t
APU\tGARUDA\tGTCP131-9B\tP-10418\tGanjar\tOverhaul\t7-Jan-25\tSIGIT\tFIRMAN\tCLOSED\tCLOSED\t
APU\tGMF\tGTCP331-350C\tR-388C\tYanqo\tMinimum\t13-Jan-25\tSIGIT\tDENNY\tINPROGRESS\tWIP\t
Engine\tCitilink\tCFM56-5B\t645388\tDhimas\tOverhaul\t22-Jan-25\tFIRMAN\tDENNY\tINPROGRESS\tWIP\tEASA
Engine\tAeroplus\tCFM56-3\t860129\tAfrizal\tMinimum\t3-Feb-25\tDENNY\tFIRMAN\tCLOSED\tCLOSED\t
APU\tCitilink\tGTCP131-9A\tP-5434\tYanqo\tOverhaul\t3-Feb-25\tADING\tGISEL\tCLOSED\tCLOSED\t
Engine\tTransNusa\tCFM56-5B\t577819\tDhimas\tMinimum\t12-Feb-25\tSIGIT\tDENNY\tCLOSED\tCLOSED\t
Engine\tBBN Airlines\tCFM56-7B\t960445\tAditya\tMinimum\t13-Feb-25\tDENNY\tSIGIT\tCLOSED\tCLOSED\t
Engine\tGARUDA\tCFM56-7B\t961621\tDhimas\tMinimum\t4-Mar-25\tSIGIT\tFIRMAN\tCLOSED\tCLOSED\t
Engine\tGARUDA\tCFM56-7B\t890545\tAfrizal\tMinimum\t12-Mar-25\tFIRMAN\tSIGIT\tCLOSED\tCLOSED\t
Engine\tAirasia\tCFM56-5B\t697661\tAfrizal\tMinimum\t19-Mar-25\tDENNY\tSIGIT\tCLOSED\tCLOSED\tEASA
APU\tCitilink\tGTCP131-9A\tP-9157\tYuli\tOverhaul\t14-Apr-25\tGISEL\tDENNY\tCLOSED\tCLOSED\t
Engine\tBaranahan\tCFM56-3\t721648\tDony\tOverhaul\t17-Apr-25\tFIRMAN\tGISEL\tINPROGRESS\tWIP\t
Engine\tK-Mile\tCFM56-3\t725275\tDhimas\tMinimum\t15-May-25\tDENNY\tFIRMAN\tCLOSED\tCLOSED\t
Engine\tEASTAR\tCFM56-7B\t804491\tAditya\tMinimum\t22-May-25\tFIRMAN\tDENNY\tCLOSED\tWIP\tEASA
Engine\tRIMBUN\tCFM56-7B\t888830\tAfrizal\tMinimum\t28-May-25\tSIGIT\tFIRMAN\tCLOSED\tCLOSED\t
Engine\tBaranahan\tCFM56-3\t858686\tHardhani\tOverhaul\t9-Jun-25\tFIRMAN\tDENNY\tINPROGRESS\tWIP\t
Engine\tTEXEL/CHISHOLM\tCFM56-7B\t888453\tKikin\tMinimum\t10-Jun-25\tSIGIT\tGISEL\tCLOSED\tCLOSED\tEASA
Engine\tCITILINK\tCFM56-5B\t569361\tDhimas\tOverhaul\t3-Jul-25\tSIGIT\tFIRMAN\tCLOSED\tCLOSED\tEASA
Engine\tCITILINK\tCFM56-5B\t645375\tAditya\tOverhaul\t10-Jul-25\tDENNY\tGISEL\tCLOSED\tCLOSED\tEASA
Engine\tCITILINK\tCFM56-5B\t645384\tHardhani\tOverhaul\t18-Jul-25\tFIRMAN\tSIGIT\tINPROGRESS\tWIP\tEASA
APU\tCitilink\tGTCP131-9A\tP-5436\tGanjar\tOverhaul\t21-Jul-25\tFIRMAN\tGISEL\tCLOSED\tCLOSED\t
Engine\tRIMBUN\tCFM56-7B\t856630\tAditya\tMinimum\t23-Jul-25\tDENNY\tADING\tCLOSED\tCLOSED\t
Engine\tCITILINK\tCFM56-5B\t645373\tAditya\tOverhaul\t29-Jul-25\tDENNY\tADING\tINPROGRESS\tWIP\tEASA
APU\tCitilink\tGTCP131-9A\tP-5458\tYuli\tOverhaul\t4-Aug-25\tADING\tDENNY\tCLOSED\tCLOSED\t
Engine\tCITILINK\tCFM56-5B\t573348\tHardhani\tTop Case\t6-Aug-25\tFIRMAN\tSIGIT\tCLOSED\tCLOSED\tEASA
APU\tCitilink\tGTCP131-9A\tP-5331\tYanqo\tOverhaul\t6-Aug-25\tGISEL\tADING\tCLOSED\tCLOSED\t
APU\tCitilink\tGTCP131-9A\tP-5938\tGanjar\tOverhaul\t11-Aug-25\tDENNY\tFIRMAN\tCLOSED\tCLOSED\t
Engine\tCITILINK\tCFM56-5B\t645402\tDony\tOverhaul\t12-Aug-25\tADING\tFIRMAN\tINPROGRESS\tWIP\tEASA
APU\tCitilink\tGTCP131-9A\tP-6003\tYuli\tOverhaul\t13-Aug-25\tADING\tDENNY\tCLOSED\tWIP\t
Engine\tGARUDA\tGE90\t907774\tAditya\tMinimum\t16-Aug-25\tDENNY\tGISEL\tCLOSED\tCLOSED\t
APU\tCitilink\tGTCP131-9A\tP-5954\tGanjar\tOverhaul\t19-Aug-25\tADING\tGISEL\tINPROGRESS\tWIP\t
Engine\tCITILINK\tCFM56-5B\t645369\tDhimas\tOverhaul\t20-Aug-25\tSIGIT\tGISEL\tINPROGRESS\tWIP\tEASA
Engine\tGARUDA\tCFM56-7B\t960821\tDony\tMedium\t26-Aug-25\tADING\tFIRMAN\tCLOSED\tWIP\tInvestigation
Engine\tCITILINK\tCFM56-5B\t645406\tDhimas\tOverhaul\t27-Aug-25\tSIGIT\tDENNY\tINPROGRESS\tWIP\tEASA
Engine\tGARUDA\tCFM56-7B\t962784\tKikin\tMinimum 14\t3-Sep-25\tGISEL\tDENNY\tCLOSED\tCLOSED\t
Engine\tGARUDA\tGE90\t907613\tAditya\tSR\t12-Sep-25\tDENNY\tFIRMAN\tINPROGRESS\tWIP\t
Engine\tLAO\tCFM56-5B\t645338\tKikin\tMinimum 30\t17-Sep-25\tGISEL\tSIGIT\tCLOSED\tCLOSED\t
APU\tCITILINK\tGTCP131-9A\tP-6433\tGanjar\tOverhaul\t17-Sep-25\tADING\tGISEL\tINPROGRESS\tWIP\t
Engine\tGARUDA\tCFM56-7B\t660754\tDony\tMinimum\t19-Sep-25\tADING\tDENNY\tCLOSED\tCLOSED\t
Engine\tGARUDA\tCFM56-7B\t962962\tDhimas\tMinimum\t22-Sep-25\tSIGIT\tFIRMAN\tCLOSED\tCLOSED\tQT HPTB & RDS
Engine\tGARUDA\tCFM56-7B\t962963\tKikin\tMinimum 14\t1-Oct-25\tGISEL\tDENNY\tCLOSED\tCLOSED\t
Engine\tBARANAHAN\tCFM56-3\t856742\tAfrizal\tMinimum 14\t6-Oct-25\tFIRMAN\tSIGIT\tCLOSED\tCLOSED\t
Engine\tGARUDA\tCFM56-7B\t962771\tDhimas\tMinimum 14\t17-Oct-25\tSIGIT\tFIRMAN\tCLOSED\tCLOSED\t
APU\tCITILINK\tGTCP131-9A\tP-5431\tYuli\tOverhaul\t21-Oct-25\tFIRMAN\tGISEL\tCLOSED\tWIP\t
Engine\tGARUDA\tCFM56-7B\t962864\tKikin\tMinimum 14\t31-Oct-25\tGISEL\tDENNY\tCLOSED\tCLOSED\t
Engine\tECA\tCFM56-3\t725249\tHardhani\tMinimum\t17-Nov-25\tFIRMAN\tDENNY\tCLOSED\tCLOSED\t
APU\tGARUDA\tGTCP131-9B\tP-5575\tYogie\tMinimum 14\t24-Nov-25\tGISEL\tADING\tCLOSED\tCLOSED\t
Engine\tGARUDA\tCFM56-7B\t658464\tKikin\tMinimum\t25-Nov-25\tGISEL\tSIGIT\tCLOSED\tCLOSED\tplan release 3 Dec
Engine\tBBN Airlines\tCFM56-7B\t961424\tAfrizal\tMinimum 45\t26-Nov-25\tFIRMAN\tADING\tCLOSED\tCLOSED\tfwd sump leak
Engine\tGARUDA\tCFM56-7B\t657643\tKikin\tMinimum\t5-Dec-25\tGISEL\tFIRMAN\tCLOSED\tCLOSED\t
APU\tGARUDA\tGTCP131-9B\tP-8236\tGanjar\tOverhaul\t6-Jan-26\tGISEL\tADING\tINPROGRESS\tWIP\t
Engine\tCITILINK\tCFM56-5B\t575401\tKikin\tMinimum 21\t7-Jan-26\tGISEL\tDENNY\tCLOSED\tWIP\t
Engine\tGARUDA\tCFM56-7B\t960367\tHardhani\tMinimum\t12-Jan-26\tFIRMAN\tGISEL\tCLOSED\tCLOSED\tFinding Fan Containment Case
APU\tGARUDA\tGTCP131-9B\tP-10692\tGanjar\tOverhaul\t13-Jan-26\tDENNY\tSIGIT\tINPROGRESS\tWIP\t
Engine\tGARUDA\tCFM56-7B\t658830\tDhimas\tMinimum\t22-Jan-26\tSIGIT\tGISEL\tCLOSED\tCLOSED\t
APU\tCITILINK\tGTCP131-9A\tP-5297\tMaman\tOverhaul\t28-Jan-26\tGISEL\tSIGIT\tINPROGRESS\tWIP\t
Engine\tGARUDA\tCFM56-7B\t657958\tKikin\tQT\t10-Feb-26\tGISEL\tDENNY\tCLOSED\tCLOSED\t
Engine\tFTAI\tCFM56-5B\t699105\tHardhani\tMinimum Recert\t18-Feb-26\tFIRMAN\tSIGIT\tCLOSED\tCLOSED\t
Engine\tGARUDA\tCFM56-7B\t660235\tDhimas\tQT\t23-Feb-26\tSIGIT\tADING\tCLOSED\tCLOSED\t
Engine\tGARUDA\tCFM56-7B\t960285\tDony\tOverhaul\t25-Feb-26\tADING\tSIGIT\tINPROGRESS\tWIP\t
Engine\tFTAI\tCFM56-5B\t697533\tAditya\tMinimum\t2-Mar-26\tDENNY\tGISEL\tCLOSED\tCLOSED\t
Engine\tGARUDA\tCFM56-7B\t658993\tDhimas\tQT\t5-Mar-26\tSIGIT\tGISEL\tCLOSED\tCLOSED\t
Engine\tGARUDA\tCFM56-7B\t960341\tDony\tOverhaul\t9-Mar-26\tSIGIT\tADING\tINPROGRESS\tWIP\t
Engine\tCITILINK\tCFM56-5B\t697783\tKikin\tMinimum\t16-Mar-26\tGISEL\tSIGIT\tINPROGRESS\tWIP\t
Engine\tGARUDA\tCFM56-7B\t658754\tKikin\tQT\t9-Apr-26\tGISEL\tDENNY\tCLOSED\tWIP\t
APU\tGARUDA\tGTCP131-9B\tP-10976\tGanjar\tMedium\t10-Apr-26\tFIRMAN\tDENNY\tCLOSED\tCLOSED\t
Engine\tAirasia\tCFM56-5B\t697743\tAditya\tMinimum\t15-Apr-26\tDENNY\tSIGIT\tINPROGRESS\tWIP\t
Engine\tK-Mile\tCFM56-3\t857830\tKikin\tMinimum\t22-Apr-26\tGISEL\tADING\tCLOSED\tCLOSED\t
APU\tGARUDA\tGTCP131-9B\tP-8699\tGanjar\tOverhaul\t22-Apr-26\tSIGIT\tFIRMAN\tINPROGRESS\tWIP\t
Engine\tGARUDA\tCFM56-7B\t658828\tKikin\tMinimum\t28-Apr-26\tGISEL\tDENNY\tINPROGRESS\tWIP\t
APU\tGARUDA\tGTCP131-9B\tP-10227\tGanjar\tOverhaul\t29-Apr-26\tFIRMAN\tADING\tINPROGRESS\tWIP\t
Engine\tBaranahan\tCFM56-3\t722282\tHardhani\tMinimum (Teardown module)\t11-May-26\tFIRMAN\tDENNY\tINPROGRESS\tWIP\t
Engine\tGARUDA\tCFM56-7B\t658753\tKikin\tQT\t12-May-26\tGISEL\tSIGIT\tCLOSED\tCLOSED\t
Engine\tFTAI\tCFM56-5B\t577511\tDhimas\tTop Case\t18-May-26\tSIGIT\tFIRMAN\tCLOSED\tCLOSED\t
Engine\tFTAI\tCFM56-5B\t577365\tDhimas\tMinimum\t2-Jun-26\tSIGIT\tDENNY\tINPROGRESS\t\tLPT Swap
Engine\tFTAI\tCFM56-5B\t577556\tDhimas\tRecertification\t2-Jun-26\tSIGIT\tDENNY\tCLOSED\tCLOSED\t
Engine\tFTAI\tCFM56-5B\t802387\tDhimas\tRecertification\t8-Jun-26\tSIGIT\tDENNY\tINPROGRESS\t\t
Engine\tFTAI\tCFM56-5B\t779160\tDhimas\tRecertification\t15-Jun-26\tSIGIT\tDENNY\tINPROGRESS\t\t
Engine\tFTAI\tCFM56-5B\t779308\tDhimas\tRecertification\t22-Jun-26\tSIGIT\tDENNY\tINPROGRESS\t\t
Engine\tFTAI\tCFM56-5B\t577128\tDhimas\tRecertification\t22-Jun-26\tSIGIT\tDENNY\tINPROGRESS\t\t
Engine\tGARUDA\tGE90\t907861\tAditya\tSplit & Mating\tN/A\tFIRMAN\tDENNY\tCLOSED\tCLOSED\t
APU\tGMF\tGTCP131-9B\tP-8080\tGanjar\tInvestigation\t9-Jun-26\tADING\tGISEL\tINPROGRESS\t\t
Engine\tGARUDA\tCFM56-7B\t962797\tKikin\tQT\t17-Jun-26\tGISEL\tADING\tINPROGRESS\t\t
Engine\tGARUDA\tGE90\t907612\tAditya\tSplit Module\t24-Jun-26\tDENNY\tFIRMAN\tINPROGRESS\t\t
Engine\tFTAI\tCFM56-5B\t697409\tDhimas\tTest & Recert\t25-Jun-26\tSIGIT\tDENNY\tINPROGRESS\t\t
Engine\tFTAI\tCFM56-5B\t577203\tDhimas\tTest & Recert\t30-Jun-26\tSIGIT\tDENNY\tINPROGRESS\t\t
Engine\tGARUDA\tCFM56-7B\t962621\tKikin\tQT\t15-Jul-26\tGISEL\tDENNY\tINPROGRESS\t\t
APU\tGMF\tGTCP131-9B\tP-5302\tGanjar\tMedium\t15-Jul-26\tADING\tGISEL\t\t\t
Engine\tCITILINK\tCFM56-5B\t569989\tAditya\tMinimum (Oil Leak FF)\t7-Jul-26\tDENNY\tGISEL\t\t\t
Engine\tGARUDA\tGE90\t907833\tAditya\tMinimum (Split Module)\t10-Jul-26\tDENNY\tFIRMAN\t\t\t`;

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

// Dates arrive as "D-Mon-YY" (e.g. "1-Oct-20"). `new Date("1-Oct-20")` parses this
// as LOCAL midnight, then toISOString() UTC-shifts it back a day whenever the
// machine's timezone is ahead of UTC — the same off-by-one bug found and fixed in
// the Excel import earlier. Parse the three parts manually and build the date via
// Date.UTC so it's never routed through local-time interpretation at all.
function parseDate(s: string): string | null {
  const t = s.trim();
  if (!t || t === "N/A" || t === "-") return null;
  const match = /^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/.exec(t);
  if (!match) return null;
  const [, dayStr, monStr, yearStr] = match;
  const month = MONTHS[(monStr ?? "").toLowerCase()];
  if (month == null) return null;
  const day = Number(dayStr);
  const year = 2000 + Number(yearStr);
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
}

function clean(s: string | undefined): string | null {
  const t = (s ?? "").trim();
  return t === "" || t === "-" ? null : t;
}

async function main() {
  const { db } = await import("@/db");
  const { repairPlannerEntries } = await import("@/db/schema");

  const lines = RAW.split("\n").filter((l) => l.trim());
  let imported = 0;

  for (const line of lines) {
    const cols = line.split("\t");
    const [
      engineApu,
      customer,
      engineType,
      serialNumber,
      eo,
      workscope,
      inductionDate,
      rpc1,
      rpc2,
      gate4Status,
      projectStatus,
      remark,
    ] = cols;

    await db.insert(repairPlannerEntries).values({
      engineApu: clean(engineApu),
      customer: clean(customer),
      engineType: clean(engineType),
      serialNumber: clean(serialNumber),
      eo: clean(eo),
      workscope: clean(workscope),
      inductionDate: parseDate(inductionDate ?? ""),
      rpc1: clean(rpc1),
      rpc2: clean(rpc2),
      gate4Status: clean(gate4Status),
      projectStatus: clean(projectStatus),
      remark: clean(remark),
    });
    imported++;
  }

  console.log(`Imported ${imported} repair planner entries`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
