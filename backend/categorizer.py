import re
from typing import Tuple

CATEGORY_RULES = [
    (
        "Pain Relief & Fever",
        [
            r"\bPARACETAMOL\b",
            r"\bDICLOFENAC\b",
            r"\bACECLOFENAC\b",
            r"\bNIMESULIDE\b",
            r"\bIBUPROFEN\b",
            r"\bTRAMADOL\b",
            r"\bSERRATIOPEPTIDASE\b",
            r"\bHOT\s*GEL\b",
            r"\bPAIN\s*RELIEF\b",
            r"\bCHLORZOXAZONE\b",
            r"\bCROCIN\b",
            r"\bCALPOL\b",
            r"\bDOLO\b",
            r"\bCOMBIFLAM\b",
            r"\bMEFTAL\b",
            r"\bMEFENAMIC\b",
            r"\bBRUFEN\b",
            r"\bVOLINI\b",
            r"\bMOOV\b",
            r"\bIODEX\b",
        ],
    ),
    (
        "Antibiotics & Infections",
        [
            r"\bCEFIXIME\b",
            r"\bAMOXYCILLIN\b",
            r"\bAMOXICILLIN\b",
            r"\bCLAVULANIC\b",
            r"\bOFLOXACIN\b",
            r"\bAZITHROMYCIN\b",
            r"\bCIPROFLOXACIN\b",
            r"\bCEFPODOXIME\b",
            r"\bAMIKACIN\b",
            r"\bPIPRATAZ\b",
            r"\bPIPERACILLIN\b",
            r"\bTAZOBACTAM\b",
            r"\bORNIDAZOLE\b",
            r"\bLEVOFLOXACIN\b",
            r"\bDOXYCYCLINE\b",
            r"\bAUGMENTIN\b",
            r"\bAZITHRAL\b",
            r"\bCEFTUM\b",
            r"\bTAXIM\b",
            r"\bMAHACEF\b",
            r"\bMONOCEF\b",
            r"\bNORFLOXACIN\b",
            r"\bMETRONIDAZOLE\b",
            r"\bFLAGYL\b",
        ],
    ),
    (
        "Acidity & Digestion",
        [
            r"\bPANTOPRAZOLE\b",
            r"\bOMEPRAZOLE\b",
            r"\bRABEPRAZOLE\b",
            r"\bESOMEPRAZOLE\b",
            r"\bLOPERAMIDE\b",
            r"\bORAL\s*REHYDRATION\b",
            r"\bORS\b",
            r"\bANTACID\b",
            r"\bALCID\b",
            r"\bDIGE\b",
            r"\bDIGENE\b",
            r"\bSUCRALFATE\b",
            r"\bDOMPERIDONE\b",
            r"\bPAN[- ]*D\b",
            r"\bPAN[- ]*40\b",
            r"\bOOCID\b",
            r"\bOCID\b",
            r"\bENO\b",
            r"\bGAS[- ]*O[- ]*FAST\b",
            r"\bGELUSIL\b",
            r"\bCREMAFFIN\b",
            r"\bISABGOL\b",
        ],
    ),
    (
        "Cold, Cough & Allergy",
        [
            r"\bPHENSEDYL\b",
            r"\bLEVOCETIRIZINE\b",
            r"\bCETIRIZINE\b",
            r"\bMONTELUKAST\b",
            r"\bAMBROXOL\b",
            r"\bDEXTROMETHORPHAN\b",
            r"\bCHLORPHENIRAMINE\b",
            r"\bTRUSTYL\b",
            r"\bCOUGH\b",
            r"\bSYRUP\b",
            r"\bSYP\b",
            r"\bALERID\b",
            r"\bOKACET\b",
            r"\bASCORIL\b",
            r"\bBENADRYL\b",
            r"\bGRILINCTUS\b",
            r"\bSINAREST\b",
            r"\bCHEESTON\b",
            r"\bVAPORUB\b",
            r"\bNASAL\b",
            r"\bOTRIVIN\b",
        ],
    ),
    (
        "Diabetes Care",
        [
            r"\bMETFORMIN\b",
            r"\bGLIMEPIRIDE\b",
            r"\bVOGLIBOSE\b",
            r"\bTENELIGLIPTIN\b",
            r"\bDAPAGLIFLOZIN\b",
            r"\bINSULIN\b",
            r"\bGLICLAZIDE\b",
            r"\bGLYCOMET\b",
            r"\bGLUCOPHAGE\b",
            r"\bAMARYL\b",
            r"\bJANUVIA\b",
            r"\bSITAGLIPTIN\b",
            r"\bGALVUS\b",
            r"\bVILDAGLIPTIN\b",
            r"\bGLUCONORM\b",
        ],
    ),
    (
        "Heart & Blood Pressure",
        [
            r"\bTELMISARTAN\b",
            r"\bAMLODIPINE\b",
            r"\bATORVASTATIN\b",
            r"\bROSUVASTATIN\b",
            r"\bMETOPROLOL\b",
            r"\bLOSARTAN\b",
            r"\bCLOPIDOGREL\b",
            r"\bENALAPRIL\b",
            r"\bTELMA\b",
            r"\bNORVASC\b",
            r"\bLIPITOR\b",
            r"\bATROVA\b",
            r"\bROSUVAS\b",
            r"\bDEPIN\b",
            r"\bBETALOC\b",
            r"\bECOSPRIN\b",
            r"\bASPIRIN\b",
            r"\bRAMIPRIL\b",
        ],
    ),
    (
        "Vitamins & Supplements",
        [
            r"\bVITAMIN\b",
            r"\bLIMCEE\b",
            r"\bZINC\b",
            r"\bZINCOVIT\b",
            r"\bCALCIUM\b",
            r"\bSHELCAL\b",
            r"\bB[- ]*COMPLEX\b",
            r"\bBECOSULES\b",
            r"\bFOLIC\s*ACID\b",
            r"\bFERROUS\b",
            r"\bMULTIVITAMIN\b",
            r"\bD3\b",
            r"\bCALCIROL\b",
            r"\bEVION\b",
            r"\bNEUROBION\b",
            r"\bCOBADEX\b",
            r"\bSUPRADYN\b",
            r"\bREVITAL\b",
            r"\bPROTEIN\b",
        ],
    ),
    (
        "Skin Care & Antifungals",
        [
            r"\bLULICONAZOLE\b",
            r"\bKETOCONAZOLE\b",
            r"\bCLOTRIMAZOLE\b",
            r"\bPOVIDINE\b",
            r"\bPOVIDONE\b",
            r"\bITRACONAZOLE\b",
            r"\bTERBINAFINE\b",
            r"\bOINTMENT\b",
            r"\bSOAP\b",
            r"\bBETNOVATE\b",
            r"\bCANDID\b",
            r"\bDERMICEM\b",
            r"\bFOURDERM\b",
            r"\bLULICAT\b",
            r"\bLULIFIN\b",
            r"\bITMAC\b",
            r"\bBETADINE\b",
            r"\bSCABOMA\b",
            r"\bPERMETHRIN\b",
        ],
    ),
    (
        "Eye & Ear Drops",
        [
            r"\bEYE\s*DROP\b",
            r"\bEAR\s*DROP\b",
            r"\bOPHTHALMIC\b",
            r"\bCARBOXYMETHYLCELLULOSE\b",
            r"\bMOXIFLOXACIN\s*DROPS\b",
            r"\bREFRESH\s*TEARS\b",
            r"\bCIPLOX\s*EYE\b",
            r"\bTOBRADEX\b",
            r"\bOTIC\b",
            r"\bCLEAR\s*EYES\b",
        ],
    ),
    (
        "Ayurvedic & Herbal",
        [
            r"\bAYURVEDIC\b",
            r"\bHERBAL\b",
            r"\bCHURNA\b",
            r"\bTAILA\b",
            r"\bASAVA\b",
            r"\bKADHA\b",
            r"\bCHYAWANPRASH\b",
            r"\bDABUR\b",
            r"\bBAIDYANATH\b",
            r"\bHIMALAYA\b",
            r"\bLIV[- ]*52\b",
            r"\bASHWAGANDHA\b",
            r"\bSHILAJIT\b",
            r"\bTRIPHALA\b",
            r"\bNEEM\b",
            r"\bTULSI\b",
        ],
    ),
    (
        "Surgical & Medical Supplies",
        [
            r"\bSYRINGE\b",
            r"\bNEEDLE\b",
            r"\bSURGICAL\b",
            r"\bCOTTON\b",
            r"\bBANDAGE\b",
            r"\bCONDOM\b",
            r"\bFLASK\b",
            r"\bGLOVES\b",
            r"\bTHERMOMETER\b",
            r"\bCANNULA\b",
            r"\bIV\s*SET\b",
            r"\bGAUZE\b",
            r"\bMICROPORE\b",
            r"\bSPIRIT\b",
            r"\bSCALPEL\b",
            r"\bMASK\b",
            r"\bDISPOVAN\b",
        ],
    ),
]

# Molecules that strictly require prescription (Schedule H / H1 / X)
SCHEDULE_H_PATTERNS = [
    r"\bCEFIXIME\b",
    r"\bAMOXYCILLIN\b",
    r"\bCLAVULANIC\b",
    r"\bOFLOXACIN\b",
    r"\bAZITHROMYCIN\b",
    r"\bCIPROFLOXACIN\b",
    r"\bCEFPODOXIME\b",
    r"\bAMIKACIN\b",
    r"\bPIPRATAZ\b",
    r"\bPIPERACILLIN\b",
    r"\bTAZOBACTAM\b",
    r"\bORNIDAZOLE\b",
    r"\bLEVOFLOXACIN\b",
    r"\bDOXYCYCLINE\b",
    r"\bTRAMADOL\b",
    r"\bTELMISARTAN\b",
    r"\bAMLODIPINE\b",
    r"\bATORVASTATIN\b",
    r"\bROSUVASTATIN\b",
    r"\bMETOPROLOL\b",
    r"\bLOSARTAN\b",
    r"\bCLOPIDOGREL\b",
    r"\bMETFORMIN\b",
    r"\bGLIMEPIRIDE\b",
    r"\bVOGLIBOSE\b",
    r"\bTENELIGLIPTIN\b",
    r"\bDAPAGLIFLOZIN\b",
    r"\bINSULIN\b",
    r"\bPREGABALIN\b",
    r"\bCLONAZEPAM\b",
    r"\bALPRAZOLAM\b",
    r"\bZOLPIDEM\b",
    r"\bCODEINE\b",
]

RX_MANDATORY_CATEGORIES = {
    "Antibiotics & Infections",
    "Heart & Blood Pressure",
    "Diabetes Care",
}


def clean_text(text: str) -> str:
    """Normalize text and strip distributor blanks."""
    if not text:
        return ""
    text = str(text).strip()
    # Normalize common distributor blank notations
    if text.upper() in ["-BLANK-", "BLANK", "N/A", "NA", "NONE", "NULL", "-"]:
        return ""
    return text


def categorize_medicine(name: str, salt: str = "") -> Tuple[str, bool]:
    """
    Categorize a medicine based on its salt formulation and brand name.
    Returns: (category: str, requires_prescription: bool)
    """
    clean_salt_str = clean_text(salt).upper()
    clean_name_str = clean_text(name).upper()
    combined_text = f"{clean_salt_str} {clean_name_str}"

    matched_category = "General Healthcare"

    # Pass 1: Try matching salt first (salt is most medically accurate)
    if clean_salt_str:
        for category, patterns in CATEGORY_RULES:
            for pattern in patterns:
                if re.search(pattern, clean_salt_str, re.IGNORECASE):
                    matched_category = category
                    break
            if matched_category != "General Healthcare":
                break

    # Pass 2: If salt didn't yield a match or was blank, check the medicine name
    if matched_category == "General Healthcare":
        for category, patterns in CATEGORY_RULES:
            for pattern in patterns:
                if re.search(pattern, clean_name_str, re.IGNORECASE):
                    matched_category = category
                    break
            if matched_category != "General Healthcare":
                break

    # Prescription logic:
    # 1. Mandatory if in critical categories
    # 2. Or if matches any Schedule H / H1 / narcotics molecule
    requires_rx = False
    if matched_category in RX_MANDATORY_CATEGORIES:
        requires_rx = True
    else:
        for pat in SCHEDULE_H_PATTERNS:
            if re.search(pat, combined_text, re.IGNORECASE):
                requires_rx = True
                break

    return matched_category, requires_rx


def calculate_selling_price(mrp: float, cost_price: float = 0.0, discount_pct: float = 12.0) -> float:
    """
    Calculate customer selling price with a standard store discount (e.g. 12% off MRP),
    guaranteeing it never falls below wholesale cost price.
    """
    try:
        mrp_val = float(mrp)
    except (ValueError, TypeError):
        mrp_val = 0.0

    try:
        cost_val = float(cost_price)
    except (ValueError, TypeError):
        cost_val = 0.0

    if mrp_val <= 0:
        return round(cost_val, 2)

    discounted = mrp_val * (1.0 - (discount_pct / 100.0))

    # Protect pharmacy margin: never sell below cost price
    final_price = max(discounted, cost_val)
    # Never exceed MRP
    final_price = min(final_price, mrp_val)

    return round(final_price, 2)

