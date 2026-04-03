import { Typography } from '@mui/material'
import { Popup } from 'react-leaflet'
import type { Node } from '../types/types'

export default function PopupWarehouse({ node }: { node: Node }) {
    return (
        <Popup>
            <Typography variant="subtitle2">{node.name}</Typography>
            <Typography variant="body2">В наявності:</Typography>
            {node.inventory && node.inventory.map(i => <Typography>{i.resource_id} {i.quantity}</Typography>)}
        </Popup>
    )
}
