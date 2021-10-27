/**
 * @author Brendan McGuire
 * @date 26 October 2021
 * 
 * Room Selection Screen
 */

import { Building, BUILDINGS } from "@lib/client/data";
import { useRouter } from "next/router";

export default function() {
    const router = useRouter();
    const { id } = router.query as { id?: string };

    if (!id || !BUILDINGS.hasOwnProperty(id)) {
        return router.push("/building");
    };

};
