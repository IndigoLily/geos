#![allow(dead_code, unused_imports, unused_variables, unused_mut)]

use std::fmt::{self, Display};
use std::ops::{Deref, Add};
use std::path::PathBuf;
use std::collections::HashMap as Map;
use std::str::FromStr;

use svg::node::element::path::{Command, Data, Position, Parameters, Number as SvgNumber};
use svg::node::element::tag::Path;
use svg::node::element::tag;
use svg::parser::Event;

use serde::{Serialize, Deserialize};

fn path_cmd_inner(cmd: &Command) -> Option<(&Position, &Parameters)> {
    match cmd {
        Command::Close                             => None,
        Command::Move(pos, params)                 |
        Command::Line(pos, params)                 |
        Command::HorizontalLine(pos, params)       |
        Command::VerticalLine(pos, params)         |
        Command::QuadraticCurve(pos, params)       |
        Command::SmoothQuadraticCurve(pos, params) |
        Command::CubicCurve(pos, params)           |
        Command::SmoothCubicCurve(pos, params)     |
        Command::EllipticalArc(pos, params)        => Some((pos, params)),
    }
}

#[derive(Debug, Hash, Eq, PartialEq, Clone)]
#[derive(Serialize, Deserialize)]
#[serde(into = "String")]
enum MapFeature {
    Land,
    Forest,
    Desert,
    Swamp,
    Mountain,
    Volcano,
    Lake,
    River,
}

impl FromStr for MapFeature {
    type Err = ();
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        use MapFeature::*;
        Ok(match s {
            "Land"      => Land,
            "Forests"   => Forest,
            "Deserts"   => Desert,
            "Swamps"    => Swamp,
            "Mountains" => Mountain,
            "Volcanoes" => Volcano,
            "Rivers"    => River,
            "Lakes"     => Lake,
            _ => return Err(()),
        })
    }
}

impl Display for MapFeature {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> Result<(), std::fmt::Error> {
        use MapFeature::*;
        write!(f, "{}", match self {
            Land     => "land",
            Forest   => "forest",
            Desert   => "desert",
            Swamp    => "swamp",
            Mountain => "mountain",
            Volcano  => "volcano",
            River    => "river",
            Lake     => "lake",
        })
    }
}

impl Into<String> for MapFeature {
    fn into(self) -> String {
        self.to_string()
    }
}

#[derive(Debug, Default, Clone, Copy)]
#[derive(Serialize, Deserialize)]
#[serde(into = "[SvgNumber;2]")]
struct Point {
    x: SvgNumber,
    y: SvgNumber,
}

impl Add for Point {
    type Output = Point;
    fn add(self, other: Self) -> Self::Output {
        Point {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}

impl Into<[SvgNumber;2]> for Point {
    fn into(self) -> [SvgNumber;2] {
        [self.x, self.y]
    }
}

impl Into<Vec<SvgNumber>> for Point {
    fn into(self) -> Vec<SvgNumber> {
        vec![self.x, self.y]
    }
}

const SVG_SIZE: (SvgNumber, SvgNumber) = (10000.0, 5000.0);

fn main() {
    // get path from first argument, second element (index 1) in env::args
    let svg_file_path = PathBuf::from(std::env::args().nth(1).unwrap());
    let svg_file_path = svg_file_path.canonicalize().unwrap();

    let mut map_feature_stack: Vec<MapFeature> = Vec::new();

    type MapPath = Vec<Point>;
    let mut paths: Map<MapFeature, Vec<MapPath>> = Map::new();

    //let mut content = String::new();
    for event in svg::open(svg_file_path, &mut String::new()).unwrap() {
        match event {
            Event::Tag("g", tag::Type::Start, attr) => {
                if let (Some(groupmode), Some(label)) =
                    (attr.get("inkscape:groupmode"), attr.get("inkscape:label"))
                {
                    if groupmode.deref() == "layer" {
                        if let Ok(feature) = label.parse() {
                            map_feature_stack.push(feature);
                            eprintln!("layer \"{}\" start", map_feature_stack.last().unwrap());
                        }
                    }
                }
            }

            Event::Tag("g", tag::Type::End, _attr) => {
                if let Some(ending_layer) = map_feature_stack.pop() {
                    eprintln!("layer \"{}\" end", ending_layer);
                }
            }

            Event::Tag("path", tag_type, attr) => if !map_feature_stack.is_empty() {
                let data = attr.get("d").unwrap();
                let data = Data::parse(data).unwrap();

                let mut points: Vec<Point> = Vec::new();
                let mut current_pos = Point::default();

                for cmd in data.iter() {
                    match cmd {
                        Command::Move(pos, params) | Command::Line(pos, params) => {
                            assert!(params.len() % 2 == 0);
                            let mut cmd_points: Vec<Point> = params.chunks(2).map(|pair| Point{ x: pair[0], y: pair[1] }).collect();
                            if *pos == Position::Relative {
                                for p in cmd_points.iter_mut() {
                                    *p = *p + current_pos;
                                    current_pos = *p;
                                }
                            } else {
                                current_pos = *cmd_points.last().unwrap();
                            }
                            points.extend(cmd_points);
                        },

                        Command::VerticalLine(pos, params) => {
                            let p = Point { x: 0.0, y: params[0] } +
                                if *pos == Position::Relative { current_pos } else { Point::default() };
                            current_pos = p;
                            points.push(p);
                        },

                        Command::HorizontalLine(pos, params) => {
                            let p = Point { x: params[0], y: 0.0 } +
                                if *pos == Position::Relative { current_pos } else { Point::default() };
                            current_pos = p;
                            points.push(p);
                        },

                        Command::Close => (),

                        _ => eprintln!("unrecognized path command: {:?}", cmd)
                    }
                }

                paths.entry(map_feature_stack.last().unwrap().clone()).or_default().push(points);
            },

            _ => {},
        }
    }

    for feature_paths in paths.values_mut() {
        for path in feature_paths.iter_mut() {
            for point in path.iter_mut() {
                point.x = (point.x / SVG_SIZE.0 - 0.5) * 360.0; // transform from [0,10000] range to [-180,180] range
                point.y = (point.y / SVG_SIZE.1 - 0.5) * 180.0; // transform from [0,5000] range to [-90,90] range
            }
        }
    }

    for (map_feature_type, paths) in paths.iter() {
        println!("Feature type \"{}\" has {} paths", map_feature_type, paths.len());
    }

    let json = std::fs::File::create("map.json").unwrap();
    serde_json::to_writer_pretty(json, &paths).unwrap();
}
